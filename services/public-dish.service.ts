import { api } from "./api";

// ==========================================================================
// GET /public/dishes -- platos disponibles de restaurantes cercanos activos,
// dentro del mismo radio/filtros que Explore (PublicDishController /
// PublicDishService en el back). Pensado para la pestaña "Platos" del
// comensal en explorar-resultados.tsx: a diferencia de /dishes (CRUD del
// restaurante dueño del plato), este es de solo lectura y ya viene con el
// restaurante embebido. Ver src/modules/public-dishes en el back.
//
// OJO `search`: FindPublicDishesDto extiende FindRestaurantsDto sin
// agregar nada propio, así que en el back ese filtro busca por
// `nombre_comercial` del restaurante (vía ExploreService.findRestaurants),
// NO por el nombre del plato -- el back no filtra los `platos` en sí por
// texto. Por eso el buscador de la pantalla filtra por nombre de plato
// del lado del cliente en vez de mandar `search` acá.
// ==========================================================================

export interface PublicDishRestaurant {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  estado_operativo: "abierto" | "cerrado" | "cerrado_temporal" | "vacaciones";
  calificacion_promedio: number;
  cantidad_resenas: number;
}

export interface PublicDishCategory {
  id: string;
  nombre: string;
  icono_id: string | null;
  iconos?: { url: string } | null;
}

export interface PublicDishImage {
  id: string;
  url: string;
  orden: number;
}

// Igual al enum estado_disponibilidad de Prisma en el backend.
export type PublicDishStatus = "disponible" | "agotado";

export interface PublicDish {
  id: string;
  restaurante_id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  estado: PublicDishStatus; // findAvailable solo devuelve disponibles
  activo: boolean;
  created_at: string;
  updated_at: string;
  categorias: PublicDishCategory; // categoria_id es obligatorio en platos
  plato_imagenes: PublicDishImage[];
  restaurante: PublicDishRestaurant;
  distancia?: number; // solo viene si se mandó latitude + longitude
}

// Detalle: el back manda más datos del restaurante (dirección, ciudad,
// horarios, etc.) que el listado. Ver PublicDishService.findOne.
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

// Mismos filtros que ExploreService.findRestaurants (FindPublicDishesDto
// extiende FindRestaurantsDto en el back para que ambos listados usen el
// mismo radio).
export interface FindPublicDishesFilters {
  search?: string;
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