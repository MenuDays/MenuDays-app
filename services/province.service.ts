import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export interface Province {
    id: number;
    nombre: string;
}

const STORAGE_KEY = "@MenuDays:selectedProvince";

// Las provincias son datos de referencia casi estáticos (no cambian en
// el uso normal de la app) -- se cachean en memoria para que volver a
// entrar a la pantalla de selección no dependa de un round-trip de red
// cada vez, y se sienta instantáneo.
let provincesCache: Province[] | null = null;

class ProvinceService {
    /**
     * Obtiene todas las provincias desde el backend (cacheadas en memoria
     * después del primer fetch de la sesión).
     */
    async getAll(): Promise<Province[]> {
        if (provincesCache) return provincesCache;
        const data = await api<Province[]>("/locations/provincias");
        provincesCache = data;
        return data;
    }

    /**
     * Guarda la provincia seleccionada.
     */
    async saveSelectedProvince(province: Province): Promise<void> {
        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(province)
        );
    }

    /**
     * Devuelve la provincia seleccionada.
     */
    async getSelectedProvince(): Promise<Province | null> {
        const value = await AsyncStorage.getItem(STORAGE_KEY);

        if (!value) return null;

        return JSON.parse(value);
    }

    /**
     * Elimina la provincia guardada.
     */
    async clearSelectedProvince(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    }
}

export default new ProvinceService();