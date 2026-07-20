import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;

  province?: {
    id: number;
    name: string;
  };

  city?: {
    id: number;
    name: string;
  };

  address?: string;
  latitude?: number;
  longitude?: number;
}

const USER_STORAGE_KEY = "@MenuDays:user";

class UserService {
  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async getMe(): Promise<User> {
    return await api<User>("/users/profile");
  }

  /**
   * Actualiza el perfil.
   */
  async updateProfile(
    data: Partial<User>
  ): Promise<User> {
    return await api<User>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Guarda el usuario localmente.
   */
  async saveLocal(user: User): Promise<void> {
    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(user)
    );
  }

  /**
   * Obtiene el usuario guardado.
   */
  async getLocal(): Promise<User | null> {
    const value = await AsyncStorage.getItem(
      USER_STORAGE_KEY
    );

    if (!value) return null;

    return JSON.parse(value);
  }

  /**
   * Elimina el usuario del almacenamiento local.
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }
}

export default new UserService();