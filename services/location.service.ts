import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export interface City {
  id: number;
  nombre: string;
}

export interface UserLocation {
  province: {
    id: number;
    nombre: string;
  };
  city: {
    id: number;
    nombre: string;
  };
  address: string;
  latitude: number;
  longitude: number;
}

const CITY_STORAGE_KEY = "@MenuDays:selectedCity";
const LOCATION_STORAGE_KEY = "@MenuDays:userLocation";

class LocationService {
  /**
   * Obtiene las ciudades de una provincia desde el backend.
   */
  async getCitiesByProvince(
    provinceId: number
  ): Promise<City[]> {
    return await api<City[]>(
      `/locations/provincias/${provinceId}/ciudades`
    );
  }

  /**
   * Guarda la ciudad seleccionada.
   */
  async saveSelectedCity(city: City): Promise<void> {
    await AsyncStorage.setItem(
      CITY_STORAGE_KEY,
      JSON.stringify(city)
    );
  }

  /**
   * Obtiene la ciudad seleccionada.
   */
  async getSelectedCity(): Promise<City | null> {
    const value = await AsyncStorage.getItem(
      CITY_STORAGE_KEY
    );

    if (!value) return null;

    return JSON.parse(value);
  }

  /**
   * Guarda la ubicación completa del usuario.
   */
  async saveUserLocation(
    location: UserLocation
  ): Promise<void> {
    await AsyncStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(location)
    );
  }

  /**
   * Obtiene la ubicación guardada del usuario.
   */
  async getUserLocation(): Promise<UserLocation | null> {
    const value = await AsyncStorage.getItem(
      LOCATION_STORAGE_KEY
    );

    if (!value) return null;

    return JSON.parse(value);
  }

  /**
   * Elimina la ciudad y la ubicación almacenadas.
   */
  async clearLocation(): Promise<void> {
    await AsyncStorage.multiRemove([
      CITY_STORAGE_KEY,
      LOCATION_STORAGE_KEY,
    ]);
  }
}

export default new LocationService();