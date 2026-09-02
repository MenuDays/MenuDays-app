import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Platform } from "react-native";

const BASE_URL = "https://menudays-api-production.up.railway.app/api";
const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Inicia sesión nuevamente.";

export interface ApiOptions extends RequestInit {
  // Códigos de status que son un resultado esperado del endpoint
  // (ej: 404 = "todavía no existe X") y por lo tanto no deben
  // mostrarse como un error en consola / LogBox de Expo Go.
  silentStatuses?: number[];
}

// El back vive en Railway: si estuvo un rato sin tráfico el contenedor
// puede quedar "dormido", y durante un redeploy hay ~1 min en el que
// todavía no acepta conexiones. En esos casos la PRIMERA petición puede
// fallar a nivel de red (fetch() tira "Network request failed" o se
// cuelga) AUNQUE el dispositivo tenga internet perfectamente: no es que
// no haya conexión, es que el server todavía está arrancando.
//
// La estrategia acá:
//  - Un fetch() que se rechaza MUY rápido casi siempre significa que la
//    petición nunca salió del dispositivo (sin red, DNS, o conexión
//    rechazada porque el contenedor todavía no escucha). Eso es seguro
//    de reintentar -- no llegó a impactar en el server -- así que se
//    reintenta en silencio, con backoff creciente, dándole tiempo a
//    Railway a terminar de reanudarse.
//  - Un fetch() que TARDA en fallar (o nuestro propio timeout) pudo
//    haber llegado al server. Reintentar una mutación ahí podría
//    duplicar el recurso, así que NO se reintenta: se corta y se avisa
//    que "el server está tardando" (que NO es lo mismo que "sin
//    internet").
//  - Solo si de verdad no se logró contactar al server se muestra el
//    cartel de "revisá tu conexión".

const CONNECTION_ERROR_MESSAGE =
  "Revisa tu conexión a internet e intenta nuevamente.";

// El servidor recibió la petición pero tardó demasiado en contestar (o
// la respuesta se perdió). NO es un problema de conexión. En una
// mutación NO se reintenta a ciegas -- el recurso pudo haberse creado.
const SLOW_SERVER_MESSAGE =
  "El servidor está tardando más de lo normal. Espera unos segundos y " +
  "revisa si se guardó antes de volver a intentarlo.";

// Timeouts separados según el tipo de petición:
//  - JSON normal (GET/PATCH livianos): 25s alcanza de sobra incluso
//    despertando el contenedor de Railway.
//  - Subida de archivos (multipart/form-data, ej. foto de un menú/plato/
//    promoción/galería): la foto puede pesar varios MB y encima el back
//    la reenvía a Cloudinary, así que un timeout corto disparaba un
//    falso "revisá tu conexión" con el menú a medio subir. 120s da
//    margen real en datos móviles lentos; si de verdad no hay red,
//    fetch() falla al toque igual (no espera el timeout completo).
const REQUEST_TIMEOUT_MS = 25000;
const UPLOAD_TIMEOUT_MS = 120000;

// Por debajo de esto, un fetch() rechazado se considera "falló rápido"
// => la petición nunca llegó al server => es seguro reintentarla. Por
// encima, pudo haber llegado => no se reintenta una mutación.
const FAST_FAILURE_MS = 6000;

// Un GET/HEAD se repite libremente (no tiene efectos secundarios).
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD"]);
const MAX_GET_RETRIES = 3;
const GET_RETRY_DELAY_MS = 900;

// Mutaciones: solo se reintentan cuando el fetch() falló rápido (nunca
// llegó al server). El backoff creciente le da tiempo al contenedor de
// Railway a reanudarse, sin reintentar a ciegas algo que pudo impactar
// ni hacer esperar de más a quien de verdad está sin señal.
//
// Para las SUBIDAS (menú/plato/promo/galería) el reintento interno es
// corto: son caras y, en el caso del menú, el que reintenta de verdad
// (con chequeo contra el servidor y sin riesgo de duplicar) es
// MenuService.create.
const MUTATION_RETRY_BACKOFF_MS = [1200, 2500, 4000, 6000];
const UPLOAD_RETRY_BACKOFF_MS = [1500];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

type TimedError = Error & { code?: "TIMEOUT" };

function makeTimeoutError(): TimedError {
  const err: TimedError = new Error(SLOW_SERVER_MESSAGE);
  err.code = "TIMEOUT";
  return err;
}

// ¿El body es un FormData (subida multipart)?
//
// NO se usa `instanceof FormData`: en el build de producción (Hermes +
// minificación) ese chequeo puede dar FALSE aunque el body SÍ sea un
// FormData -- y entonces el upload caía en el camino con AbortController,
// que rompe las subidas multipart en React Native. Ese era justo el
// caso "en Expo publica bien, en la APK da error". Acá se detecta por
// forma: cualquier body que NO sea string ni ArrayBuffer/typed-array se
// trata como subida (FormData, Blob).
function isUploadBody(body: BodyInit | null | undefined): boolean {
  if (body == null) return false;
  if (typeof body === "string") return false;
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body as any)) return false;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    return false;
  }
  return true;
}

// --------------------------------------------------------------------------
// Subida de multipart con archivo: uploader NATIVO (solo en iOS/Android,
// solo cuando hay UN archivo local).
//
// El problema: en SDK 54 / RN 0.81 el `fetch` global de React Native NO
// envía de forma confiable un body multipart/form-data que contiene un
// archivo en un build STANDALONE de Android. En Expo Go anda perfecto
// (usa la capa de red de desarrollo), pero en la APK firmada la request
// muere en la capa nativa antes de llegar al server -> la app terminaba
// mostrando "No se pudo publicar el menú...". La recomendación de Expo
// para subir archivos es justamente NO depender de ese fetch.
//
// Acá el POST/PATCH con una imagen local se hace con el uploader nativo
// de expo-file-system (OkHttp puro): se comporta EXACTO igual en Expo Go
// y en la APK, y el server recibe exactamente el mismo request (mismos
// campos de texto, mismo archivo, mismo boundary multipart) -- no puede
// notar la diferencia.
//
// Este camino es PURAMENTE ADITIVO:
//   - Web, o body que no es FormData, o FormData sin archivo, o con más
//     de un archivo (ej. el alta de restaurante manda 3) -> sigue por el
//     `fetch` de siempre, sin tocar nada.
//   - Si el módulo nativo falla ANTES de tener respuesta HTTP -> se cae
//     al `fetch` de siempre. Nunca quedamos peor que antes.
type NativeUploadOutcome<T> = { handled: true; data: T } | { handled: false };

async function tryNativeMultipartUpload<T>(
  url: string,
  method: string,
  form: any,
  token: string | null,
  extraHeaders: HeadersInit | undefined
): Promise<NativeUploadOutcome<T>> {
  if (Platform.OS === "web") return { handled: false };
  if (!form || typeof form.getParts !== "function") return { handled: false };

  const parts: any[] = form.getParts();
  const fileParts = parts.filter((p) => p && typeof p.uri === "string");
  // 0 archivos: no es una subida real -> que la maneje el fetch normal.
  // >1 archivo: el uploadAsync nativo solo admite uno -> fetch normal.
  if (fileParts.length !== 1) return { handled: false };

  const file = fileParts[0];
  let fileUri: string = file.uri;
  // Mismo criterio de normalización que buildFormData: algunos orígenes
  // en Android devuelven una ruta sin esquema.
  if (fileUri.startsWith("/")) fileUri = "file://" + fileUri;
  // Solo archivos LOCALES. Si la uri es http(s) (ej. editar un menú sin
  // cambiar la foto: llega la foto_url remota de Cloudinary) el uploader
  // nativo no puede leerla -> se deja pasar al fetch de siempre.
  if (!/^(file|content|assets-library|ph):/i.test(fileUri)) {
    return { handled: false };
  }

  // Campos de texto del formulario -> parameters (multipart text parts).
  const parameters: Record<string, string> = {};
  for (const p of parts) {
    if (p && typeof p.string === "string") parameters[p.fieldName] = p.string;
  }

  let FileSystem: any;
  try {
    FileSystem = require("expo-file-system/legacy");
  } catch {
    return { handled: false };
  }

  let result: { status: number; body?: string };
  try {
    result = await FileSystem.uploadAsync(url, fileUri, {
      httpMethod: (method || "POST").toUpperCase(),
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: file.fieldName,
      mimeType: typeof file.type === "string" ? file.type : "image/jpeg",
      parameters,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((extraHeaders as Record<string, string>) || {}),
      },
    });
  } catch (error) {
    // Falló el módulo nativo ANTES de tener respuesta HTTP (no es un
    // 4xx/5xx). Se cae al fetch de siempre en vez de romper.
    if (__DEV__) {
      console.log("[api] uploadAsync nativo falló, uso fetch:", error);
    }
    return { handled: false };
  }

  const text = result.body ?? "";
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (__DEV__) {
    console.log("STATUS (native upload):", result.status);
    console.log("RESPONSE (native upload):", text);
  }

  if (result.status < 200 || result.status >= 300) {
    if (result.status === 401) {
      handleUnauthorized();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    throw new Error(
      data.message || data.error || "Ocurrió un error en el servidor."
    );
  }

  return { handled: true, data: data as T };
}

// Un solo intento de fetch con timeout propio.
//
// IMPORTANTE: en las SUBIDAS (multipart/form-data) NO se usa
// AbortController. En React Native, pasar `signal` junto con un body
// FormData que tiene un archivo puede hacer que `fetch` rechace al
// instante con "Network request failed" (o que aborte antes de tiempo)
// -- justo el falso "error de conexión" al publicar un menú. Para las
// subidas se usa Promise.race con un temporizador: si tarda de más,
// dejamos de esperar (el fetch sigue de fondo y se descarta) y avisamos
// "servidor lento", sin abortar la conexión a mano.
//
// Para el resto (GET/PATCH JSON livianos) se mantiene el AbortController
// de siempre.
async function attemptFetch(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const isUpload = isUploadBody(options.body);

  if (isUpload) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(makeTimeoutError()), timeoutMs);
    });
    try {
      return await Promise.race([fetch(url, options), timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw makeTimeoutError();
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Maneja SOLO fallas a nivel de red (nunca llegó a haber respuesta
// HTTP): fetch() rechazado o nuestro timeout. Un 4xx/5xx real del back
// NO pasa por acá -- eso ya es una Response y se procesa en api().
async function fetchWithRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const isUpload = isUploadBody(options.body);
  const isMutation = !IDEMPOTENT_METHODS.has(method);
  const timeoutMs = isUpload ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;

  let lastError: unknown;

  // ---- GET / HEAD: reintento simple, se pueden repetir sin riesgo ----
  if (!isMutation) {
    for (let attempt = 0; attempt <= MAX_GET_RETRIES; attempt++) {
      try {
        return await attemptFetch(url, options, timeoutMs);
      } catch (error) {
        lastError = error;
        if (attempt < MAX_GET_RETRIES) await sleep(GET_RETRY_DELAY_MS);
      }
    }
    console.log("[api] Falló la conexión (GET):", lastError);
    throw new Error(CONNECTION_ERROR_MESSAGE);
  }

  // ---- POST / PATCH / PUT / DELETE ----
  // Solo se reintenta si el fetch() falló RÁPIDO (la petición nunca
  // salió del dispositivo). Si tardó en fallar o fue nuestro timeout, la
  // petición pudo haber llegado al server: reintentar duplicaría el
  // recurso, así que se corta y se informa "server lento".
  const backoffs = isUpload ? UPLOAD_RETRY_BACKOFF_MS : MUTATION_RETRY_BACKOFF_MS;
  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    const startedAt = Date.now();
    try {
      return await attemptFetch(url, options, timeoutMs);
    } catch (error) {
      lastError = error;
      const elapsed = Date.now() - startedAt;

      if (
        (error as TimedError).code === "TIMEOUT" ||
        elapsed >= FAST_FAILURE_MS
      ) {
        console.log("[api] El server tardó demasiado (mutación):", lastError);
        throw new Error(SLOW_SERVER_MESSAGE);
      }

      const backoff = backoffs[attempt];
      if (backoff === undefined) break;
      await sleep(backoff);
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
  // OJO: por forma, NO por `instanceof` (ver isUploadBody). Si acá diera
  // mal, se le ponía "Content-Type: application/json" a un FormData y el
  // server no podía parsear el multipart -> "no se pudo publicar" SOLO
  // en la APK de producción.
  const isFormData = isUploadBody(options.body);

  const url = `${BASE_URL}${endpoint}`;
  const method = (options.method || "GET").toUpperCase();

  if (__DEV__) {
    console.log("================================");
    console.log("URL:", url);
    console.log("METHOD:", method);
    console.log("BODY:", options.body);
    console.log("================================");
  }

  // Subida con un archivo local en nativo -> uploader nativo de
  // expo-file-system (ver tryNativeMultipartUpload). Aditivo: si no
  // aplica (web / sin archivo / >1 archivo) o el módulo nativo falla de
  // entrada, devuelve { handled: false } y seguimos por el fetch normal.
  if (isFormData) {
    const native = await tryNativeMultipartUpload<T>(
      url,
      method,
      options.body,
      token,
      options.headers
    );
    if (native.handled) return native.data;
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
