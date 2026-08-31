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
  // true si el teléfono/ubicación/ciudad de arriba vienen del
  // restaurante vinculado a esta cuenta (no de un dato personal propio
  // del comensal) -- pasa con cuentas de restaurante que nunca
  // completaron esos campos "como comensal". Ver getProfile en el back.
  usingRestaurantInfo?: boolean;
}

/**
 * Forma que espera el backend en el body del PATCH /users/profile
 * (coincide con UpdateProfileDto de NestJS). A diferencia de `User`,
 * provinceId/cityId van como IDs sueltos, no como objetos anidados
 * {id, name} -- esa forma anidada es solo la de la respuesta.
 */
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  provinceId?: number;
  cityId?: number;
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
    data: UpdateProfilePayload
  ): Promise<User> {
    return await api<User>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Sube la foto de perfil (comensal o administrador, ambos son
   * `usuarios` -- ver PATCH /users/profile/photo en el back).
   */
  async uploadPhoto(image: any): Promise<{ photoUrl: string; message: string }> {
    const formData = new FormData();

    formData.append("image", {
      uri: image.uri,
      name: image.fileName ?? "photo.jpg",
      type: image.mimeType ?? image.type ?? "image/jpeg",
    } as any);

    return await api("/users/profile/photo", {
      method: "PATCH",
      body: formData,
      headers: {},
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