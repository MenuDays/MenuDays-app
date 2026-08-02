import { api } from "./api";

// ==========================================================================
// GET /explore/restaurants -- listado público de restaurantes (ExploreController
// / ExploreService en el back). Devuelve las filas de `restaurantes` tal cual
// (snake_case, sin relaciones incluidas), más `distancia` si se mandan
// latitude+longitude. Ver prisma/src/modules/explore.
// ==========================================================================

export interface ExploreRestaurant {
  id: string;
  nombre_comercial: string;
  descripcion: string | null;
  direccion: string | null;
  ciudad_id: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
  logo_url: string | null;
  portada_url: string | null;
  estado_operativo: "abierto" | "cerrado";
  calificacion_promedio: number;
  cantidad_resenas: number;
  distancia?: number; // solo viene si se mandó latitude + longitude
}

export interface FindRestaurantsFilters {
  search?: string;
  provinceId?: number | string;
  cityId?: number | string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

class ExploreService {
  async findRestaurants(filters: FindRestaurantsFilters = {}): Promise<ExploreRestaurant[]> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.provinceId != null) params.append("provinceId", String(filters.provinceId));
    if (filters.cityId != null) params.append("cityId", String(filters.cityId));
    if (filters.radius != null) params.append("radius", String(filters.radius));
    if (filters.latitude != null) params.append("latitude", String(filters.latitude));
    if (filters.longitude != null) params.append("longitude", String(filters.longitude));

    const qs = params.toString();
    return await api<ExploreRestaurant[]>(`/explore/restaurants${qs ? `?${qs}` : ""}`);
  }
}

export default new ExploreService();
