import AsyncStorage from "@react-native-async-storage/async-storage";

// Borrador del formulario "Registrar restaurante".
//
// POR QUÉ EXISTE: al tocar "Sacar foto" se abre la cámara/galería (una
// Activity aparte). En Android, con poca RAM libre, el sistema mata el
// proceso de la app mientras esa Activity está en primer plano. Al
// volver, la app arranca DE CERO -> se pierde todo lo cargado y el
// usuario termina en Inicio (comensal) porque el splash lo rutea ahí
// según su rol. Guardando el formulario acá en cada cambio, si eso pasa
// se puede rehidratar todo y volver al formulario sin perder nada
// (ver splash.tsx y register-restaurant.tsx).
//
// Es un borrador LOCAL y efímero: no viaja al backend ni reemplaza nada.

const KEY = "@MenuDays:restaurantRequestDraft";

// Si el borrador es más viejo que esto se considera "abandonado" (no una
// interrupción reciente): sigue disponible para "continuar" desde el
// perfil, pero el splash ya no manda de una al formulario.
export const DRAFT_FRESH_MS = 30 * 60 * 1000;

export interface RestaurantDraftData {
  logo: string | null;
  restaurantName: string;
  province: { id: number; nombre: string } | null;
  city: { id: number; nombre: string } | null;
  location: { latitude: number; longitude: number; address: string } | null;
  phone: string;
  countryCode: string; // ISO, ej "EC"
  description: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  idFront: string | null;
  idBack: string | null;
  schedules: {
    day: number;
    closed: boolean;
    openingHour: string;
    closingHour: string;
  }[];
  // Qué campo de imagen se estaba completando cuando se abrió la
  // cámara/galería. Si Android mató la app en ese momento, al volver se
  // usa esto para saber dónde poner la foto recuperada
  // (ImagePicker.getPendingResultAsync).
  pendingPick: "logo" | "idFront" | "idBack" | null;
}

interface StoredDraft {
  updatedAt: number;
  data: RestaurantDraftData;
}

class RestaurantDraftStore {
  async save(data: RestaurantDraftData): Promise<void> {
    try {
      const payload: StoredDraft = { updatedAt: Date.now(), data };
      await AsyncStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      // Guardar el borrador es "best effort": si falla no rompemos el
      // formulario, solo se pierde la red de seguridad ante un reinicio.
    }
  }

  async load(): Promise<StoredDraft | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredDraft;
      if (!parsed?.data || typeof parsed.updatedAt !== "number") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // ignorar
    }
  }

  /** true si hay un borrador y se guardó hace poco (interrupción reciente). */
  async hasFreshDraft(): Promise<boolean> {
    const stored = await this.load();
    if (!stored) return false;
    return Date.now() - stored.updatedAt < DRAFT_FRESH_MS;
  }
}

export default new RestaurantDraftStore();
