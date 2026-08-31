import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const BASE_URL = "https://menudays-api-production.up.railway.app/api";
const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Inicia sesión nuevamente.";

export interface ApiOptions extends RequestInit {
  // Códigos de status que son un resultado esperado del endpoint
  // (ej: 404 = "todavía no existe X") y por lo tanto no deben
  // mostrarse como un error en consola / LogBox de Expo Go.
  silentStatuses?: number[];
}

// El back vive en Railway: si estuvo un rato sin tráfico, el contenedor
// puede quedar "dormido" y la PRIMERA petición que lo despierta a veces
// ni siquiera llega a completarse a nivel de red (fetch() tira
// "Network request failed" o se cuelga) -- no es que no haya internet,
// es que el server todavía está arrancando. Por eso antes aparecía ese
// cartelito de la nada y, al tocar "Aceptar" y reintentar la MISMA
// acción un segundo después (con el server ya despierto), andaba bien.
//
// Acá se reintenta un par de veces, en silencio (con el mismo loading
// que ya tiene cada pantalla mientras espera el await), ANTES de
// mostrarle cualquier error al usuario. Recién si los 3 intentos fallan
// de verdad se asume que es un problema real de conexión.
const MAX_NETWORK_RETRIES = 3;
const RETRY_DELAY_MS = 900;

// Verificación de accesibilidad del back (endpoint público y barato).
// Cualquier RESPUESTA HTTP -- incluso 401/404 -- prueba que hay internet
// y que el server está vivo; solo un rechazo de fetch() o el timeout
// cuentan como "inalcanzable". Se reintenta varias veces porque el
// contenedor de Railway puede tardar 20-30s en despertar del todo.
const PROBE_TIMEOUT_MS = 8000;
const PROBE_MAX_ATTEMPTS = 6;
const PROBE_DELAY_MS = 1500;

// Timeouts separados según el tipo de petición:
//  - JSON normal (GET/PATCH livianos): 25s alcanza de sobra incluso
//    despertando el contenedor de Railway.
//  - Subida de archivos (multipart/form-data, ej. foto de un menú/plato/
//    promoción/galería): la foto puede pesar varios MB y encima el back
//    la reenvía a Cloudinary, así que un timeout corto disparaba un falso
//    "revisá tu conexión" con el menú a medio subir. 120s da margen real
//    en datos móviles lentos; si de verdad no hay red, fetch() falla al
//    toque igual (no espera el timeout completo). Además, para las
//    subidas se hace un "ping" previo para no mandar los MB contra un
//    server dormido (ver api()).
const REQUEST_TIMEOUT_MS = 25000;
const UPLOAD_TIMEOUT_MS = 120000;

const CONNECTION_ERROR_MESSAGE =
  "Revisa tu conexión a internet e intenta nuevamente.";

// Un GET/HEAD se repite libremente (no tiene efectos secundarios). Un
// POST/PATCH/PUT/DELETE es más delicado: si el primer intento LLEGÓ a
// impactar en el server y solo se perdió la respuesta, un reintento
// podría duplicar el recurso. Por eso las mutaciones no se reintentan
// "a ciegas" -- solo tras CONFIRMAR con un ping que el back recién
// ahora está accesible (señal casi segura de que el primer intento
// falló porque el contenedor estaba dormido y la petición nunca llegó).
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD"]);
const MAX_MUTATION_RETRIES = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// true si el back respondió CUALQUIER cosa (aunque sea 401/404). Un
// rechazo de fetch() o el timeout -> false. Reintenta unas cuantas veces
// para darle tiempo al contenedor de Railway a terminar de arrancar.
async function backendIsReachable(): Promise<boolean> {
  for (let attempt = 1; attempt <= PROBE_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      await fetch(`${BASE_URL}/categories`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      clearTimeout(timeoutId);
      if (attempt < PROBE_MAX_ATTEMPTS) await sleep(PROBE_DELAY_MS);
    }
  }
  return false;
}

// Si el token guardado venció o quedó inválido (ver comentario en
// AuthService.getSession -- el chequeo de sesión es "optimista", no se
// valida contra el server hasta la primera llamada protegida real), el
// back responde 401 en CUALQUIER endpoint protegido. Antes cada pantalla
// lo manejaba a su manera (perfil.tsx lo tragaba en silencio y quedaba
// en blanco para siempre; pedidos.tsx mostraba el "Unauthorized" crudo
// del back) -- acá se maneja una sola vez, para toda la app: se limpia
// la sesión local y se manda a login con un mensaje entendible. El
// `redirecting` evita limpiar/navegar varias veces si varias pantallas
// dispararon llamadas en paralelo y todas vuelven con 401 a la vez.
let redirectingToLogin = false;
async function handleUnauthorized(): Promise<void> {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  try {
    await AsyncStorage.multiRemove(["@MenuDays:token", "@MenuDays:user"]);
  } catch {
    // Si falla la limpieza, igual redirigimos -- login vuelve a pedir
    // credenciales sin importar qué haya quedado en storage.
  }
  router.replace("/(auth)/login");
  setTimeout(() => {
    redirectingToLogin = false;
  }, 2000);
}

// true solo para fallas a NIVEL DE RED (nunca llegó a haber respuesta):
// fetch() rechazado (DNS, sin conexión, servidor inalcanzable) o el
// timeout propio de acá. Un 4xx/5xx real del back NO pasa por acá --
// esos ya tienen su propio mensaje específico y no deben reintentarse
// ni disfrazarse de "error de conexión".
async function fetchWithRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const isUpload = options.body instanceof FormData;
  const isMutation = !IDEMPOTENT_METHODS.has(method);
  const timeoutMs = isUpload ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;

  async function attemptFetch(): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  let lastError: unknown;

  // ---- GET / HEAD: reintento simple, se pueden repetir sin riesgo ----
  if (!isMutation) {
    for (let attempt = 0; attempt <= MAX_NETWORK_RETRIES; attempt++) {
      try {
        return await attemptFetch();
      } catch (error) {
        lastError = error;
        if (attempt < MAX_NETWORK_RETRIES) await sleep(RETRY_DELAY_MS);
      }
    }
    console.log("[api] Falló la conexión:", lastError);
    throw new Error(CONNECTION_ERROR_MESSAGE);
  }

  // ---- POST / PATCH / PUT / DELETE ----
  // Si el back está dormido (Railway), esta primera petición puede
  // fallar a nivel de red sin haber llegado nunca a impactar. Antes de
  // rendirse: se verifica si el server está accesible AHORA. Si sí, se
  // asume arranque en frío (la mutación no se aplicó) y se reintenta;
  // solo si el ping tampoco responde se muestra "sin conexión".
  for (let attempt = 0; attempt <= MAX_MUTATION_RETRIES; attempt++) {
    try {
      return await attemptFetch();
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_MUTATION_RETRIES) break;
      const reachable = await backendIsReachable();
      if (!reachable) break;
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.log("[api] Falló la conexión (mutación):", lastError);
  throw new Error(CONNECTION_ERROR_MESSAGE);
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = await AsyncStorage.getItem("@MenuDays:token");
  const isFormData = options.body instanceof FormData;

  const url = `${BASE_URL}${endpoint}`;
  const method = (options.method || "GET").toUpperCase();
  const isMutation = !IDEMPOTENT_METHODS.has(method);

  if (__DEV__) {
    console.log("================================");
    console.log("URL:", url);
    console.log("METHOD:", method);
    console.log("BODY:", options.body);
    console.log("================================");
  }

  // Subida de archivos (foto de menú/plato/promo/galería): antes de
  // mandar varios MB contra un back que puede estar dormido, se lo
  // "despierta" con un ping barato mientras la pantalla ya muestra su
  // loading. Así el POST/PATCH grande recién sale cuando el server está
  // despierto -- y si de verdad no hay internet, se corta acá sin dejar
  // una subida a medias.
  if (isMutation && isFormData) {
    const reachable = await backendIsReachable();
    if (!reachable) {
      throw new Error(CONNECTION_ERROR_MESSAGE);
    }
  }

  let status: number | null = null;

  try {
    const response = await fetchWithRetry(url, {
      ...options,
      headers: {
        ...(!isFormData && {
          "Content-Type": "application/json",
        }),
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...(options.headers || {}),
      },
    });

    status = response.status;

    const text = await response.text();

    if (__DEV__) {
      console.log("STATUS:", response.status);
      console.log("RESPONSE:", text);
    }

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }
      throw new Error(
        data.message || data.error || "Ocurrió un error en el servidor."
      );
    }

    return data as T;
  } catch (error) {
    const isSilent = status !== null && options.silentStatuses?.includes(status);

    if (!isSilent && __DEV__) {
      console.error("========== FETCH ERROR ==========");
      console.error(error);
      console.error("=================================");
    }
    throw error;
  }
}

// Ping liviano y silencioso para "despertar" al back en Railway lo antes
// posible (ver useEffect en app/_layout.tsx). Reintenta unas pocas veces
// en segundo plano (sin bloquear nada, sin loggear) -- un solo intento
// no alcanzaba: si el contenedor estaba dormido, ese primer fetch podía
// quedarse colgado sin nunca completar, y la pantalla real (login/home)
// terminaba pidiendo datos contra un server que todavía no despertó del
// todo. Reintentar cada pocos segundos aumenta las chances de que ya
// esté despierto para cuando el usuario llega a la primera pantalla con
// datos reales.
export function warmUpBackend(): void {
  const MAX_ATTEMPTS = 8;
  const RETRY_DELAY_MS = 4000;

  async function ping(attempt: number): Promise<void> {
    // Timeout propio: sin esto, en una red lenta cada ping podía quedar
    // colgado para siempre (fetch no tiene timeout por defecto) y se
    // acumulaban varios en segundo plano.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      await fetch(`${BASE_URL}/categories`, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch {
      clearTimeout(timeoutId);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        return ping(attempt + 1);
      }
    }
  }

  ping(1);
}
