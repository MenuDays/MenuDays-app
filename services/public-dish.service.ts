import { api } from "./api";

// ==========================================================================
// GET /public/dishes -- platos disponibles y publicados, de restaurantes
// activos, dentro del mismo radio/filtros que Explore (PublicDishController
// / PublicDishService en el back). Igual criterio que PublicMenuService,
// pero para el catálogo de `platos` (no `menus_del_dia`).
// Ver src/modules/public-dishes en el back.
// ==========================================================================

export interface PublicDishCategory {
  id: string;
  nombre: string;
}

export interface PublicDishImage {
  id: string;
  url: string;
  orden: number;
}

export interface PublicDishRestaurant {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  estado_operativo: "abierto" | "cerrado" | "cerrado_temporal" | "vacaciones";
  calificacion_promedio: number;
  cantidad_resenas: number;
}

export interface PublicDish {
  id: string;
  restaurante_id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  estado: "disponible" | "agotado";
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
  categorias: PublicDishCategory | null;
  plato_imagenes: PublicDishImage[];
  restaurante: PublicDishRestaurant;
  distancia?: number; // solo viene si se mandó latitude + longitude
}

export interface PublicDishDetail extends Omit<PublicDish, "restaurante"> {
  restaurante: PublicDishRestaurant & {
    descripcion: string | null;
    direccion: string | null;
    portada_url: string | null;
    ubicacion_lat: number;
    ubicacion_lng: number;
    ciudad: {
      id: string;
      nombre: string;
      provincia: { id: string; nombre: string };
    } | null;
    restaurante_horarios: unknown[];
  };
}

// Mismos filtros que ExploreService.findRestaurants, más categoriaId
// (FindPublicDishesDto extiende FindRestaurantsDto en el back).
export interface FindPublicDishesFilters {
  // Busca por el nombre del plato (platos.nombre), no del restaurante.
  search?: string;
  categoriaId?: number | string;
  provinceId?: number | string;
  cityId?: number | string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

class PublicDishService {
  async findAvailable(filters: FindPublicDishesFilters = {}): Promise<PublicDish[]> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.categoriaId != null) params.append("categoriaId", String(filters.categoriaId));
    if (filters.provinceId != null) params.append("provinceId", String(filters.provinceId));
    if (filters.cityId != null) params.append("cityId", String(filters.cityId));
    if (filters.radius != null) params.append("radius", String(filters.radius));
    if (filters.latitude != null) params.append("latitude", String(filters.latitude));
    if (filters.longitude != null) params.append("longitude", String(filters.longitude));

    const qs = params.toString();
    return await api<PublicDish[]>(`/public/dishes${qs ? `?${qs}` : ""}`);
  }

  async findOne(id: string): Promise<PublicDishDetail> {
    return await api<PublicDishDetail>(`/public/dishes/${id}`);
  }
}

export default new PublicDishService();
