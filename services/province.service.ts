import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Province {
    id: number;
    name: string;
}

const STORAGE_KEY = "@MenuDays:selectedProvince";

const provinces: Province[] = [
    { id: 1, name: "Azuay" },
    { id: 2, name: "Bolívar" },
    { id: 3, name: "Cañar" },
    { id: 4, name: "Carchi" },
    { id: 5, name: "Chimborazo" },
    { id: 6, name: "Cotopaxi" },
    { id: 7, name: "El Oro" },
    { id: 8, name: "Esmeraldas" },
    { id: 9, name: "Galápagos" },
    { id: 10, name: "Guayas" },
    { id: 11, name: "Imbabura" },
    { id: 12, name: "Loja" },
    { id: 13, name: "Los Ríos" },
    { id: 14, name: "Manabí" },
    { id: 15, name: "Morona Santiago" },
    { id: 16, name: "Napo" },
    { id: 17, name: "Orellana" },
    { id: 18, name: "Pastaza" },
    { id: 19, name: "Pichincha" },
    { id: 20, name: "Santa Elena" },
    { id: 21, name: "Santo Domingo de los Tsáchilas" },
    { id: 22, name: "Sucumbíos" },
    { id: 23, name: "Tungurahua" },
    { id: 24, name: "Zamora Chinchipe" },
];

class ProvinceService {
    /**
     * Obtiene todas las provincias (mock).
     */
    async getAll(): Promise<Province[]> {
        return provinces;
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