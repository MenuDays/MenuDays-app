import AsyncStorage from "@react-native-async-storage/async-storage";

export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
  province?: { id: number; name: string };
  city?: { id: number; name: string };
  address?: string;
  latitude?: number;
  longitude?: number;
}

const USER_STORAGE_KEY = "@MenuDays:user";

// Mock temporal — Belén reemplaza esto por llamada a la API
const mockUser: User = {
  id: 1,
  name: "Juan",
  lastName: "Pérez",
  email: "juan@gmail.com",
  profilePhoto: undefined,
  province: { id: 19, name: "Pichincha" },
  city: { id: 1901, name: "Quito" },
  address: "Av. Amazonas N34-183",
  latitude: -0.1807,
  longitude: -78.4678,
};

class UserService {
  /**
   * Obtiene el usuario autenticado.
   * reemplazar por GET /api/users/me con el token JWT
   */
  async getMe(): Promise<User> {
    // TODO: return await api.get('/users/me');
    return mockUser;
  }

  /**
   * Actualiza el perfil del usuario.
   * reemplazar por PATCH /api/users/me
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    // TODO: return await api.patch('/users/me', data);
    return { ...mockUser, ...data };
  }

  /**
   * Guarda el usuario en caché local.
   */
  async saveLocal(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Obtiene el usuario del caché local.
   */
  async getLocal(): Promise<User | null> {
    const value = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!value) return null;
    return JSON.parse(value);
  }

  /**
   * Elimina el usuario del caché (logout).
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }
}

export default new UserService();