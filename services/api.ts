import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://menudays-api-production.up.railway.app/api";

export interface ApiOptions extends RequestInit {
  // Códigos de status que son un resultado esperado del endpoint
  // (ej: 404 = "todavía no existe X") y por lo tanto no deben
  // mostrarse como un error en consola / LogBox de Expo Go.
  silentStatuses?: number[];
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
    const response = await fetch(url, {
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