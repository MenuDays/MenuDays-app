import AsyncStorage from "@react-native-async-storage/async-storage";

export interface City {
  id: number;
  name: string;
  provinceId: number;
}

export interface UserLocation {
  province: { id: number; name: string };
  city: { id: number; name: string };
  address: string;
  latitude: number;
  longitude: number;
}

const CITY_STORAGE_KEY = "@MenuDays:selectedCity";
const LOCATION_STORAGE_KEY = "@MenuDays:userLocation";

// Ciudades principales de Ecuador por provincia
const cities: City[] = [
  // Azuay (1)
  { id: 101, name: "Cuenca", provinceId: 1 },
  { id: 102, name: "Gualaceo", provinceId: 1 },
  { id: 103, name: "Paute", provinceId: 1 },
  // Bolívar (2)
  { id: 201, name: "Guaranda", provinceId: 2 },
  { id: 202, name: "Chillanes", provinceId: 2 },
  // Cañar (3)
  { id: 301, name: "Azogues", provinceId: 3 },
  { id: 302, name: "La Troncal", provinceId: 3 },
  // Carchi (4)
  { id: 401, name: "Tulcán", provinceId: 4 },
  { id: 402, name: "Mira", provinceId: 4 },
  // Chimborazo (5)
  { id: 501, name: "Riobamba", provinceId: 5 },
  { id: 502, name: "Alausí", provinceId: 5 },
  // Cotopaxi (6)
  { id: 601, name: "Latacunga", provinceId: 6 },
  { id: 602, name: "La Maná", provinceId: 6 },
  // El Oro (7)
  { id: 701, name: "Machala", provinceId: 7 },
  { id: 702, name: "Huaquillas", provinceId: 7 },
  { id: 703, name: "Santa Rosa", provinceId: 7 },
  // Esmeraldas (8)
  { id: 801, name: "Esmeraldas", provinceId: 8 },
  { id: 802, name: "Atacames", provinceId: 8 },
  // Galápagos (9)
  { id: 901, name: "Puerto Baquerizo Moreno", provinceId: 9 },
  { id: 902, name: "Puerto Ayora", provinceId: 9 },
  // Guayas (10)
  { id: 1001, name: "Guayaquil", provinceId: 10 },
  { id: 1002, name: "Samborondón", provinceId: 10 },
  { id: 1003, name: "Durán", provinceId: 10 },
  { id: 1004, name: "Milagro", provinceId: 10 },
  // Imbabura (11)
  { id: 1101, name: "Ibarra", provinceId: 11 },
  { id: 1102, name: "Otavalo", provinceId: 11 },
  { id: 1103, name: "Cotacachi", provinceId: 11 },
  // Loja (12)
  { id: 1201, name: "Loja", provinceId: 12 },
  { id: 1202, name: "Catamayo", provinceId: 12 },
  // Los Ríos (13)
  { id: 1301, name: "Babahoyo", provinceId: 13 },
  { id: 1302, name: "Quevedo", provinceId: 13 },
  // Manabí (14)
  { id: 1401, name: "Portoviejo", provinceId: 14 },
  { id: 1402, name: "Manta", provinceId: 14 },
  { id: 1403, name: "Bahía de Caráquez", provinceId: 14 },
  // Morona Santiago (15)
  { id: 1501, name: "Macas", provinceId: 15 },
  // Napo (16)
  { id: 1601, name: "Tena", provinceId: 16 },
  // Orellana (17)
  { id: 1701, name: "Francisco de Orellana", provinceId: 17 },
  // Pastaza (18)
  { id: 1801, name: "Puyo", provinceId: 18 },
  // Pichincha (19)
  { id: 1901, name: "Quito", provinceId: 19 },
  { id: 1902, name: "Cayambe", provinceId: 19 },
  { id: 1903, name: "Sangolquí", provinceId: 19 },
  // Santa Elena (20)
  { id: 2001, name: "Santa Elena", provinceId: 20 },
  { id: 2002, name: "Salinas", provinceId: 20 },
  { id: 2003, name: "La Libertad", provinceId: 20 },
  // Santo Domingo (21)
  { id: 2101, name: "Santo Domingo", provinceId: 21 },
  // Sucumbíos (22)
  { id: 2201, name: "Nueva Loja", provinceId: 22 },
  // Tungurahua (23)
  { id: 2301, name: "Ambato", provinceId: 23 },
  { id: 2302, name: "Baños", provinceId: 23 },
  // Zamora Chinchipe (24)
  { id: 2401, name: "Zamora", provinceId: 24 },
];

class LocationService {
  getCitiesByProvince(provinceId: number): City[] {
    return cities.filter((c) => c.provinceId === provinceId);
  }

  async saveSelectedCity(city: City): Promise<void> {
    await AsyncStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(city));
  }

  async getSelectedCity(): Promise<City | null> {
    const value = await AsyncStorage.getItem(CITY_STORAGE_KEY);
    if (!value) return null;
    return JSON.parse(value);
  }

  async saveUserLocation(location: UserLocation): Promise<void> {
    await AsyncStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(location)
    );
  }

  async getUserLocation(): Promise<UserLocation | null> {
    const value = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (!value) return null;
    return JSON.parse(value);
  }

  async clearLocation(): Promise<void> {
    await AsyncStorage.multiRemove([
      CITY_STORAGE_KEY,
      LOCATION_STORAGE_KEY,
    ]);
  }
}

export default new LocationService();