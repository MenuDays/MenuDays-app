import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export interface City {
  id: number;
  nombre: string;
  latitud: number | null;
  longitud: number | null;
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

// Mismo criterio que ProvinceService: las ciudades de una provincia son
// datos de referencia casi estáticos, se cachean en memoria por
// provincia para que la pantalla de ciudades se sienta instantánea al
// volver a entrar en la misma sesión.
const citiesCache = new Map<number, City[]>();

class LocationService {
  /**
   * Obtiene las ciudades de una provincia desde el backend (cacheadas en
   * memoria por provincia después del primer fetch de la sesión).
   */
  async getCitiesByProvince(
    provinceId: number
  ): Promise<City[]> {
    const cached = citiesCache.get(provinceId);
    if (cached) return cached;

    const data = await api<City[]>(
      `/locations/provincias/${provinceId}/ciudades`
    );
    citiesCache.set(provinceId, data);
    return data;
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