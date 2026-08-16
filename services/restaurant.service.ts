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

export type EstadoOperativo = "abierto" | "cerrado" | "cerrado_temporal" | "vacaciones";

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
  ofrece_delivery: boolean;
  nombre_delivery: string | null;
  calificacion_promedio: number;
  cantidad_resenas: number;
  estado_operativo: EstadoOperativo;
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
 * telefonos/redesSociales/horarios están en el DTO pero el service del
 * backend no los persiste todavía (confirmado). Se mandan igual porque
 * no rompe nada, pero no asumas que quedan guardados.
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
  ofreceDelivery?: boolean;
  nombreDelivery?: string | null;
  telefonos?: { telefono: string; tipo: "llamadas" | "whatsapp" | "ambos" }[];
  redesSociales?: { plataforma: RedSocial; url: string }[];
  horarios?: {
    diaSemana: number;
    horaApertura?: string;
    horaCierre?: string;
    cerrado: boolean;
  }[];
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
  // El back ya los manda en RestaurantPublicService.buildResponse() pero
  // no estaban tipados acá -- hacen falta para saber si mostrar "Delivery"
  // como medio de entrega en pedido-entrega.tsx (un restaurante sin
  // delivery configurado solo puede recibir pedidos por retiro en local).
  ofreceDelivery: boolean;
  nombreDelivery: string | null;
}
// ==========================================================================
// GET /restaurants/dashboard -- shape tal cual RestaurantService.getDashboard()
// en el backend: objeto anidado en camelCase (NO snake_case plano como se
// esperaba antes acá). "menuPublicadoHoy" ya viene calculado por el back
// (fecha_inicio/fecha_fin vigentes + estado "publicado"), así que no hace
// falta pedir GET /menus aparte para saber si el menú de hoy está publicado.
// ==========================================================================

export interface RestaurantDashboard {
  restaurante: {
    id: number;
    nombreComercial: string;
    logoUrl: string | null;
    portadaUrl: string | null;
    estadoOperativo: EstadoOperativo;
  };
  resumen: {
    calificacionPromedio: number;
    cantidadResenas: number;
    platosRegistrados: number;
    promocionesActivas: number;
    pedidosPendientes: number;
    menuPublicadoHoy: boolean;
  };
  estadisticas: {
    resenas: number;
    promocionesActivas: number;
    platosRegistrados: number;
  };
}
export interface RestaurantReview {
  id: number;

  comentario: string;

  calificacion: number;

  fecha: string;

  usuario: {
    id: number;
    nombre: string;
    foto_perfil: string | null;
  };
}
class RestaurantService {
  async getProfile(): Promise<Restaurant> {
    return await api<Restaurant>("/restaurants/profile");
  }
  async getDashboard(): Promise<RestaurantDashboard> {
  return await api("/restaurants/dashboard");
}
async getReviews(): Promise<RestaurantReview[]> {
  return await api("/restaurants/reviews");
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
  async uploadLogo(image: any): Promise<Restaurant> {
  const formData = new FormData();

  formData.append("image", {
    uri: image.uri,
    name: image.fileName ?? "logo.jpg",
    type: image.mimeType ?? image.type ?? "image/jpeg",
  } as any);

  return await api("/restaurants/profile/logo", {
    method: "POST",
    body: formData,
    headers: {},
  });
}
async uploadCover(image: any): Promise<Restaurant> {
  const formData = new FormData();

  formData.append("image", {
    uri: image.uri,
    name: image.fileName ?? "cover.jpg",
    type: image.mimeType ?? image.type ?? "image/jpeg",
  } as any);

  return await api("/restaurants/profile/cover", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

  // TODO: cuando existan los endpoints, agregar acá:
  // addPhone / removePhone
  // addSocialLink / removeSocialLink
  // updateSchedule (probablemente un PATCH por día, o un bulk update)
}

export default new RestaurantService();