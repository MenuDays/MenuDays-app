import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.0.101:3000/api";
//const BASE_URL = "http://192.168.3.16:3000/api";// Ejemplo:
// const BASE_URL = "http://192.168.1.35:3000/api";

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await AsyncStorage.getItem("@MenuDays:token");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Ocurrió un error en el servidor."
    );
  }

  return data;
}