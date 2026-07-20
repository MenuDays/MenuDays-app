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
}

export default new AuthService();