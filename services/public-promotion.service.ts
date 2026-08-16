import { api } from "./api";

// ==========================================================================
// GET /public/promotions -- promociones activas y vigentes, de restaurantes
// activos, dentro del mismo radio/filtros que Explore (PublicPromotionController
// / PublicPromotionService en el back). Mismo criterio que PublicMenuService
// y PublicDishService.
// Ver src/modules/public-promotions en el back.
// ==========================================================================

export interface PublicPromotionCategory {
  id: string;
  nombre: string;
}

export interface PublicPromotionRestaurant {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  estado_operativo: "abierto" | "cerrado" | "cerrado_temporal" | "vacaciones";
  calificacion_promedio: number;
  cantidad_resenas: number;
}

export interface PublicPromotion {
  id: string;
  restaurante_id: string;
  categoria_id: string | null;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
  categorias: PublicPromotionCategory | null;
  restaurante: PublicPromotionRestaurant;
  distancia?: number; // solo viene si se mandó latitude + longitude
}

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

// Mismos filtros que ExploreService.findRestaurants, más categoriaId
// (FindPublicPromotionsDto extiende FindRestaurantsDto en el back).
// OJO: acá no hay "search" por nombre de promoción en el back -- si se
// necesita, agregar primero FindPublicPromotionsDto.search en el back.
export interface FindPublicPromotionsFilters {
  categoriaId?: number | string;
  provinceId?: number | string;
  cityId?: number | string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

class PublicPromotionService {
  async findAvailable(filters: FindPublicPromotionsFilters = {}): Promise<PublicPromotion[]> {
    const params = new URLSearchParams();

    if (filters.categoriaId != null) params.append("categoriaId", String(filters.categoriaId));
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
