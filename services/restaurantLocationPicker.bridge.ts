// Puente en memoria (NO AsyncStorage) para devolver la ubicación elegida
// en el mapa hacia la pantalla de register-restaurant, sin persistirla
// como la ubicación del perfil del usuario.

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

class RestaurantLocationPickerBridge {
  private pending: PickedLocation | null = null;

  set(location: PickedLocation): void {
    this.pending = location;
  }

  /** Devuelve la ubicación pendiente y la limpia (se consume una sola vez). */
  consume(): PickedLocation | null {
    const value = this.pending;
    this.pending = null;
    return value;
  }
}

export default new RestaurantLocationPickerBridge();