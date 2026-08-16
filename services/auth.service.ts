import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

class AuthService {
  async login(data: LoginDto) {
    const response = await api<{
      access_token: string;
      user: any;
      message: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    await AsyncStorage.setItem(
      "@MenuDays:token",
      response.access_token
    );

    await AsyncStorage.setItem(
      "@MenuDays:user",
      JSON.stringify(response.user)
    );

    return response;
  }

  async register(data: RegisterDto) {
    const response = await api<{
      access_token: string;
      user: any;
      message: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    await AsyncStorage.setItem(
      "@MenuDays:token",
      response.access_token
    );

    await AsyncStorage.setItem(
      "@MenuDays:user",
      JSON.stringify(response.user)
    );

    return response;
  }

  async logout() {
    await api("/auth/logout", {
      method: "POST",
    });

    await AsyncStorage.multiRemove([
      "@MenuDays:token",
      "@MenuDays:user",
    ]);
  }

  /**
   * Lee la sesión guardada en AsyncStorage (token + user) sin pegarle
   * al back. No hay endpoint /auth/me para validar el token contra el
   * servidor, así que esto es un chequeo "optimista": si hay token y
   * user guardados, se asume que la sesión sigue siendo válida. Si el
   * token quedó vencido/inválido, la primera llamada protegida que
   * haga la pantalla de destino va a fallar con 401 y mostrar su
   * propio error (mismo comportamiento que ya tienen las pantallas
   * hoy). Devuelve null si no hay sesión guardada o el user guardado
   * no se puede parsear.
   */
  async getSession(): Promise<{ token: string; user: any } | null> {
    const [token, userRaw] = await AsyncStorage.multiGet([
      "@MenuDays:token",
      "@MenuDays:user",
    ]).then((pairs) => pairs.map(([, value]) => value));

    if (!token || !userRaw) {
      return null;
    }

    try {
      const user = JSON.parse(userRaw);
      return { token, user };
    } catch {
      // user guardado corrupto: mejor tratar como "sin sesión" que
      // reventar el splash.
      return null;
    }
  }
}

export default new AuthService();