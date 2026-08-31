// Puente en memoria (mismo criterio que restaurantLocationPicker.bridge.ts)
// para devolver la provincia+cantón elegidos en (province)/index.tsx y
// (province)/city.tsx cuando esas pantallas se abren en "modo selector"
// (?picker=1) desde otra pantalla -- ej. editar-perfil.tsx -- en vez de
// su flujo normal de onboarding (que guarda la ubicación del usuario y
// termina en el mapa).

export interface PickedProvinceCity {
  province: { id: number; nombre: string };
  city: { id: number; nombre: string; latitud: number | null; longitud: number | null };
}

class ProvinceCityPickerBridge {
  private pending: PickedProvinceCity | null = null;

  set(value: PickedProvinceCity): void {
    this.pending = value;
  }

  /** Devuelve la selección pendiente y la limpia (se consume una sola vez). */
  consume(): PickedProvinceCity | null {
    const value = this.pending;
    this.pending = null;
    return value;
  }
}

export default new ProvinceCityPickerBridge();
