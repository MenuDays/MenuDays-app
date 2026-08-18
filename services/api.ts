import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://menudays-api-production.up.railway.app/api";

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
const MAX_NETWORK_RETRIES = 2;
const RETRY_DELAY_MS = 900;
const REQUEST_TIMEOUT_MS = 15000;

const CONNECTION_ERROR_MESSAGE =
  "Revisa tu conexión a internet e intenta nuevamente.";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_NETWORK_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (attempt < MAX_NETWORK_RETRIES) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
    }
  }

  console.log("[api] Falló la conexión después de reintentar:", lastError);
  throw new Error(CONNECTION_ERROR_MESSAGE);
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = await AsyncStorage.getItem("@MenuDays:token");
  const isFormData = options.body instanceof FormData;

  const url = `${BASE_URL}${endpoint}`;

  console.log("================================");
  console.log("URL:", url);
  console.log("METHOD:", options.method || "GET");
  console.log("BODY:", options.body);
  console.log("TOKEN:", token);
  console.log("================================");

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

    console.log("STATUS:", response.status);

    const text = await response.text();
    console.log("RESPONSE:", text);

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(
        data.message || data.error || "Ocurrió un error en el servidor."
      );
    }

    return data as T;
  } catch (error) {
    const isSilent = status !== null && options.silentStatuses?.includes(status);

    if (!isSilent) {
      console.error("========== FETCH ERROR ==========");
      console.error(error);
      console.error("=================================");
    }
    throw error;
  }
}
