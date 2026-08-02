import { api } from "./api";


export interface RestaurantPhone {
  id: number;
  telefono: string;
}

// Igual al enum red_social_tipo de Prisma en el backend. OJO: no
// incluye "whatsapp" -- el WhatsApp del restaurante es su teléfono
// de contacto (restaurante_telefonos), no una fila de red social.
export type RedSocial = "instagram" | "facebook" | "tiktok" | "otro";

export interface RestaurantSocialLink {
  id: number;
  plataforma: RedSocial;
  url: string;
}

export interface RestaurantSchedule {
  id: number;
  dia_semana: number; // 1 = Lunes ... 7 = Domingo
  hora_apertura: string | null; // "09:00"
  hora_cierre: string | null; // "22:00"
  cerrado: boolean;
}

export interface Restaurant {
  id: number;
  nombre_comercial: string;
  descripcion: string | null;
  direccion: string | null;
  ciudad_id: number | null;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  logo_url: string | null;
  portada_url: string | null;
  calificacion_promedio: number;
  cantidad_resenas: number;
  ciudad: {
    id: number;
    nombre: string;
    provincia: { id: number; nombre: string };
  } | null;
  restaurante_telefonos: RestaurantPhone[];
  restaurante_redes_sociales: RestaurantSocialLink[];
  restaurante_horarios: RestaurantSchedule[];
}

/**
 * Forma que espera UpdateRestaurantDto en el backend.
 * OJO: no incluye teléfonos, redes sociales ni horarios -- esas
 * relaciones no están en el DTO que compartiste, así que asumo que
 * tienen (o van a tener) sus propios endpoints de create/update/delete
 * por fila. Ajustar cuando estén definidos.
 */
export interface UpdateRestaurantPayload {
  nombreComercial?: string;
  descripcion?: string;
  direccion?: string;
  ciudadId?: number;
  ubicacionLat?: number;
  ubicacionLng?: number;
  logoUrl?: string;
  portadaUrl?: string;
}

// ==========================================================================
// Vista pública de restaurante (comensal) -- GET /restaurants/:id.
// Shape tal cual RestaurantPublicService.buildResponse() en el backend.
// ==========================================================================

export interface PublicRestaurantCity {
  id: number;
  nombre: string;
  provincia: { id: number; nombre: string };
}

export interface PublicRestaurantCategory {
  restaurante_id: number;
  categoria_id: number;
  categoria: {
    id: number;
    nombre: string;
    iconos: { id: number; nombre: string; url: string } | null;
  };
}

export interface PublicGalleryImage {
  id: number;
  url: string;
  es_portada: boolean;
  orden: number;
}

export interface PublicMenuDelDia {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  foto_url: string | null;
  estado: string;
}

export interface PublicDish {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categorias: { id: number; nombre: string };
  plato_imagenes: { id: number; url: string; orden: number }[];
}

export interface PublicPromotion {
  id: number;
  titulo: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
}

export interface RestaurantPublicDetail {
  id: number;
  nombreComercial: string;
  descripcion: string | null;
  logoUrl: string | null;
  portadaUrl: string | null;
  direccion: string | null;
  ciudad: PublicRestaurantCity | null;
  ubicacion: { lat: number | null; lng: number | null };
  estadoOperativo: string;
  calificacionPromedio: number;
  cantidadResenas: number;
  horarios: RestaurantSchedule[];
  telefonos: RestaurantPhone[];
  redesSociales: RestaurantSocialLink[];
  categorias: PublicRestaurantCategory[];
  galeria: PublicGalleryImage[];
  menus: PublicMenuDelDia[];
  platos: PublicDish[];
  promociones: PublicPromotion[];
}

class RestaurantService {
  async getProfile(): Promise<Restaurant> {
    return await api<Restaurant>("/restaurants/profile");
  }

  async updateProfile(data: UpdateRestaurantPayload): Promise<Restaurant> {
    return await api<Restaurant>("/restaurants/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Vista pública (comensal) de un restaurante -- GET /restaurants/:id.
  // OJO: la forma de este endpoint (buildResponse() en
  // RestaurantPublicService) es distinta a la de /restaurants/profile
  // de arriba: viene en camelCase y con menús/platos/promociones/reseñas
  // ya incluidos, por eso usa su propio tipo (RestaurantPublicDetail) en
  // vez de reusar "Restaurant".
  async getPublicDetail(id: string | number): Promise<RestaurantPublicDetail> {
    return await api<RestaurantPublicDetail>(`/restaurants/${id}`);
  }

  // TODO: cuando existan los endpoints, agregar acá:
  // addPhone / removePhone
  // addSocialLink / removeSocialLink
  // updateSchedule (probablemente un PATCH por día, o un bulk update)
}

export default new RestaurantService();