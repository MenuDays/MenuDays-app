import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export interface Province {
    id: number;
    nombre: string;
}

const STORAGE_KEY = "@MenuDays:selectedProvince";

class ProvinceService {
    /**
     * Obtiene todas las provincias desde el backend.
     */
    async getAll(): Promise<Province[]> {
        return await api<Province[]>("/locations/provincias");
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