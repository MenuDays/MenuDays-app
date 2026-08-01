import { api } from "./api";

// Shape tal cual la devuelve RestaurantService.getProfile() en el backend
// (objeto crudo de Prisma con el include armado -- a diferencia de
// UsersService, acá no hay una función tipo buildProfileResponse que
// traduzca los nombres de columna, así que llegan en snake_case).

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

  // TODO: cuando existan los endpoints, agregar acá:
  // addPhone / removePhone
  // addSocialLink / removeSocialLink
  // updateSchedule (probablemente un PATCH por día, o un bulk update)
}

export default new RestaurantService();