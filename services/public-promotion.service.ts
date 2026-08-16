import { api } from "./api";

// ==========================================================================
// GET /public/promotions -- promociones activas y vigentes de restaurantes
// cercanos activos, dentro del mismo radio/filtros que Explore
// (PublicPromotionController / PublicPromotionService en el back). Pensado
// para la pestaña "Promociones" del comensal en explorar-resultados.tsx: a
// diferencia de /promotions (CRUD del restaurante dueño), este es de solo
// lectura y ya viene con el restaurante embebido. Ver
// src/modules/public-promotions en el back.
// ==========================================================================

export interface PublicPromotionRestaurant {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  estado_operativo: "abierto" | "cerrado" | "cerrado_temporal" | "vacaciones";
  calificacion_promedio: number;
  cantidad_resenas: number;
}

export interface PublicPromotionCategory {
  id: string;
  nombre: string;
  icono_id: string | null;
  iconos?: { url: string } | null;
}

export interface PublicPromotion {
  id: string;
  restaurante_id: string;
  titulo: string;
  categoria_id: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  precio: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean; // findAvailable solo devuelve activas y vigentes
  created_at: string;
  updated_at: string;
  restaurante: PublicPromotionRestaurant;
  categorias: PublicPromotionCategory | null; // el back ya incluye esta relación
  distancia?: number; // solo viene si se mandó latitude + longitude
}

// Detalle: el back manda más datos del restaurante (dirección, ciudad,
// horarios, etc.) que el listado. Ver PublicPromotionService.findOne.
export interface PublicPromotionDetail extends Omit<PublicPromotion, "restaurante"> {
  restaurante: PublicPromotionRestaurant & {
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

// Mismos filtros que ExploreService.findRestaurants (FindPublicPromotionsDto
// extiende FindRestaurantsDto en el back para que ambos listados usen el
// mismo radio).
export interface FindPublicPromotionsFilters {
  search?: string;
  provinceId?: number | string;
  cityId?: number | string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

class PublicPromotionService {
  async findAvailable(
    filters: FindPublicPromotionsFilters = {}
  ): Promise<PublicPromotion[]> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.provinceId != null) params.append("provinceId", String(filters.provinceId));
    if (filters.cityId != null) params.append("cityId", String(filters.cityId));
    if (filters.radius != null) params.append("radius", String(filters.radius));
    if (filters.latitude != null) params.append("latitude", String(filters.latitude));
    if (filters.longitude != null) params.append("longitude", String(filters.longitude));

    const qs = params.toString();
    return await api<PublicPromotion[]>(`/public/promotions${qs ? `?${qs}` : ""}`);
  }

  async findOne(id: string): Promise<PublicPromotionDetail> {
    return await api<PublicPromotionDetail>(`/public/promotions/${id}`);
  }
}

export default new PublicPromotionService();