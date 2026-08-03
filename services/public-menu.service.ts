import { api } from "./api";

// ==========================================================================
// GET /public/menus -- menús del día vigentes y publicados, de restaurantes
// activos, dentro del mismo radio/filtros que Explore (PublicMenuController
// / PublicMenuService en el back). Pensado para la pestaña "Menús" del
// comensal: a diferencia de /menus (CRUD del restaurante dueño del menú),
// este es de solo lectura y ya viene con el restaurante embebido.
// Ver src/modules/public-menus en el back.
// ==========================================================================

export interface PublicMenuRestaurant {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  estado_operativo: "abierto" | "cerrado" | "cerrado_temporal" | "vacaciones";
  calificacion_promedio: number;
  cantidad_resenas: number;
}

export interface PublicMenu {
  id: string;
  restaurante_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  foto_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: "publicado"; // findAvailable solo devuelve publicados
  created_at: string;
  updated_at: string;
  restaurante: PublicMenuRestaurant;
  distancia?: number; // solo viene si se mandó latitude + longitude
}

// Detalle: el back manda más datos del restaurante (dirección, ciudad,
// horarios, etc.) que el listado. Ver PublicMenuService.findOne.
export interface PublicMenuDetail extends Omit<PublicMenu, "restaurante"> {
  restaurante: PublicMenuRestaurant & {
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

// Mismos filtros que ExploreService.findRestaurants (FindPublicMenusDto
// extiende FindRestaurantsDto en el back para que ambos listados usen el
// mismo radio).
export interface FindPublicMenusFilters {
  // Matchea el campo `nombre` de menus_del_dia (el menú del día en sí,
  // ej. "Seco de pollo"). NO busca en el catálogo de `platos` (otra
  // entidad, sin relación en Prisma) ni en el nombre del restaurante
  // (eso ya lo cubre ExploreService/RestaurantesScreen).
  search?: string;
  provinceId?: number | string;
  cityId?: number | string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

class PublicMenuService {
  async findAvailable(filters: FindPublicMenusFilters = {}): Promise<PublicMenu[]> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.provinceId != null) params.append("provinceId", String(filters.provinceId));
    if (filters.cityId != null) params.append("cityId", String(filters.cityId));
    if (filters.radius != null) params.append("radius", String(filters.radius));
    if (filters.latitude != null) params.append("latitude", String(filters.latitude));
    if (filters.longitude != null) params.append("longitude", String(filters.longitude));

    const qs = params.toString();
    return await api<PublicMenu[]>(`/public/menus${qs ? `?${qs}` : ""}`);
  }

  async findOne(id: string): Promise<PublicMenuDetail> {
    return await api<PublicMenuDetail>(`/public/menus/${id}`);
  }
}

export default new PublicMenuService();