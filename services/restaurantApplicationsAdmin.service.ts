import { api } from "./api";
export type AdminApplicationStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada";

export interface RestaurantApplicationSummary {
  id: number;
  name: string;
  submittedAt: string; // texto ya formateado por ahora, ej "26 junio 2026"
  /** Color de fondo del avatar cuando no hay logo real */
  avatarColor: string;
  /** Ionicon a mostrar dentro del avatar cuando no hay logo real */
  avatarIcon: string;
}

interface PaginatedResult {
  items: RestaurantApplicationSummary[];
  total: number;
  totalPages: number;
  page: number;
}

// --- Tipos para el detalle de una solicitud ---

export interface SocialMediaLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  // WhatsApp no es un campo propio: se arma con dialCode + phone (ver buildWhatsAppNumber).
}

export interface ApplicationDocument {
  id: string;
  label: string;
  uri: string;
}

export interface RestaurantApplicationDetail extends RestaurantApplicationSummary {
  description: string;
  province: string;
  city: string;
  location: { latitude: number; longitude: number; address: string }; // mismo objeto que "location" del formulario de registro
  dialCode: string; // ej: "+593"
  phone: string; // solo el número, sin dialCode
  schedule: string;
  socialMedia: SocialMediaLinks;
  requestingUser: string;
  createdAt: string;
  documents: ApplicationDocument[];
}

// Arma el número en formato E.164 sin espacios/guiones, para usar en wa.me
export function buildWhatsAppNumber(dialCode: string, phone: string): string {
  const cleanDial = dialCode.replace(/\D/g, "");
  const cleanPhone = phone.replace(/\D/g, "");
  return `${cleanDial}${cleanPhone}`;
}


class RestaurantApplicationsAdminService {
  /**
   * Obtiene el conteo de solicitudes por estado, para los tabs.
   * TODO: reemplazar por GET /api/admin/restaurant-applications/counts
   */
  async getCounts() {
  const pendiente = await api<any[]>("/admin/restaurant-requests?status=pendiente");
  const aprobada = await api<any[]>("/admin/restaurant-requests?status=aprobada");
  const rechazada = await api<any[]>("/admin/restaurant-requests?status=rechazada");

  return {
    pendiente: pendiente.length,
    aprobada: aprobada.length,
    rechazada: rechazada.length,
  };
}

  /**
   * Obtiene una página de solicitudes para un estado dado.
   * TODO: reemplazar por GET /api/admin/restaurant-applications?status=&page=
   */
  async getByStatus(
  status: AdminApplicationStatus,
  page: number = 1
): Promise<PaginatedResult> {

  const requests = await api<any[]>(
    `/admin/restaurant-requests?status=${status}`
  );

  const items: RestaurantApplicationSummary[] = requests.map((r) => ({
    id: Number(r.id),
    name: r.nombre_comercial,
    submittedAt: new Date(r.created_at).toLocaleDateString("es-EC"),
    avatarColor: "#F5A800",
    avatarIcon: "restaurant",
  }));

  return {
    items,
    total: items.length,
    totalPages: 1,
    page: 1,
  };
}

  /**
   * Obtiene el detalle completo de una solicitud por id.
   * TODO: reemplazar por GET /api/admin/restaurant-applications/:id
   */
  async getById(id: number): Promise<RestaurantApplicationDetail> {

  const r = await api<any>(
    `/admin/restaurant-requests/${id}`
  );

  return {
    id: Number(r.id),
    name: r.nombre_comercial,
    submittedAt: new Date(r.created_at).toLocaleDateString("es-EC"),

    avatarColor: "#F5A800",
    avatarIcon: "restaurant",

    description: r.descripcion ?? "",

    province: r.provincia.nombre,
    city: r.ciudad.nombre,

    location: {
  latitude: Number(r.ubicacion_lat),
  longitude: Number(r.ubicacion_lng),
  address: r.direccion,
},

    dialCode: "+593",
    phone: r.telefono_contacto,

    schedule: "",

    socialMedia: r.redes_sociales ?? {},

    requestingUser:
      `${r.usuarios_solicitudes_restaurante_usuario_idTousuarios.nombre} ${r.usuarios_solicitudes_restaurante_usuario_idTousuarios.apellido}`,

    createdAt: new Date(r.created_at).toLocaleDateString("es-EC"),

    documents: [
      {
        id: "logo",
        label: "Logo",
        uri: r.logo_url,
      },
      {
        id: "front",
        label: "Cédula frontal",
        uri: r.cedula_frontal_url,
      },
      {
        id: "back",
        label: "Cédula posterior",
        uri: r.cedula_dorsal_url,
      },
    ],
  };
}

  /**
   * Aprueba una solicitud.
   * TODO: reemplazar por POST /api/admin/restaurant-applications/:id/approve
   */
  async approve(id: number): Promise<void> {

  await api(
    `/admin/restaurant-requests/${id}/approve`,
    {
      method: "PATCH",
    }
  );

}

  /**
   * Rechaza una solicitud.
   * TODO: reemplazar por POST /api/admin/restaurant-applications/:id/reject
   */
  async reject(
  id: number,
  reason: string
): Promise<void> {

  await api(
    `/admin/restaurant-requests/${id}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({
        rejectionReason: reason,
      }),
    }
  );

}
}

export default new RestaurantApplicationsAdminService();