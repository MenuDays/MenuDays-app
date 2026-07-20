export type AdminApplicationStatus = "accepted" | "pending" | "rejected";

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

const PAGE_SIZE = 7;

// Mock temporal - reemplazar por GET /api/admin/restaurant-applications?status=&page=
const ACCEPTED: RestaurantApplicationSummary[] = [
  { id: 1, name: "La Burguesa", submittedAt: "26 junio 2026", avatarColor: "#1A1A1A", avatarIcon: "restaurant" },
  { id: 2, name: "Pizza House", submittedAt: "25 junio 2026", avatarColor: "#43A047", avatarIcon: "restaurant" },
  { id: 3, name: "SushiGO", submittedAt: "24 junio 2026", avatarColor: "#1A1A1A", avatarIcon: "restaurant" },
  { id: 4, name: "Ensalada Fresh", submittedAt: "23 junio 2026", avatarColor: "#FBC02D", avatarIcon: "restaurant" },
  { id: 5, name: "Mariscos Quito", submittedAt: "23 junio 2026", avatarColor: "#FB8C00", avatarIcon: "restaurant" },
  { id: 6, name: "Parrilla del Valle", submittedAt: "22 junio 2026", avatarColor: "#C62828", avatarIcon: "restaurant" },
  { id: 7, name: "El sabor Ecuador", submittedAt: "21 junio 2026", avatarColor: "#EFEBE0", avatarIcon: "restaurant" },
  // TODO: hasta 35 en total — el resto vive en el backend, esto es solo la página 1
];

const PENDING: RestaurantApplicationSummary[] = [
  { id: 8, name: "La Burguesa", submittedAt: "26 junio 2026", avatarColor: "#1A1A1A", avatarIcon: "restaurant" },
];

const REJECTED: RestaurantApplicationSummary[] = [
  { id: 9, name: "La Burguesa", submittedAt: "26 junio 2026", avatarColor: "#1A1A1A", avatarIcon: "restaurant" },
  { id: 10, name: "Pizza House", submittedAt: "25 junio 2026", avatarColor: "#43A047", avatarIcon: "restaurant" },
  { id: 11, name: "SushiGO", submittedAt: "24 junio 2026", avatarColor: "#1A1A1A", avatarIcon: "restaurant" },
  { id: 12, name: "Ensalada Fresh", submittedAt: "23 junio 2026", avatarColor: "#FBC02D", avatarIcon: "restaurant" },
  { id: 13, name: "Mariscos Quito", submittedAt: "23 junio 2026", avatarColor: "#FB8C00", avatarIcon: "restaurant" },
  { id: 14, name: "Parrilla del Valle", submittedAt: "22 junio 2026", avatarColor: "#C62828", avatarIcon: "restaurant" },
  { id: 15, name: "El sabor Ecuador", submittedAt: "21 junio 2026", avatarColor: "#EFEBE0", avatarIcon: "restaurant" },
];

// Totales reales (independientes de cuántos ítems tenga el mock cargados)
const TOTALS: Record<AdminApplicationStatus, number> = {
  accepted: 35,
  pending: 1,
  rejected: 7,
};

const DATA: Record<AdminApplicationStatus, RestaurantApplicationSummary[]> = {
  accepted: ACCEPTED,
  pending: PENDING,
  rejected: REJECTED,
};

// 
// TODO: cuando esté el back, cada solicitud va a traer sus propios datos reales.
const MOCK_DETAIL_EXTRA: Omit<RestaurantApplicationDetail, keyof RestaurantApplicationSummary> = {
  description: "Ofrecemos hamburguesas artesanales",
  province: "Esmeraldas",
  city: "San Lorenzo",
  location: {
    latitude: 1.2858,
    longitude: -78.8306,
    address: "Av. República de El Salvador",
  },
  dialCode: "+593",
  phone: "987654321",
  schedule: "Lun a Dom, 11:00 - 22:00",
  socialMedia: {
    instagram: "@LaBurguesa",
    tiktok: "@LaBurguesaEC",
    facebook: "La_Burguesa",
  },
  requestingUser: "usuario@ejemplo.com",
  createdAt: "24 junio 2026",
  documents: [
    { id: "doc1", label: "Cédula (frontal)", uri: "https://placehold.co/300x190?text=Frontal" },
    { id: "doc2", label: "Cédula (posterior)", uri: "https://placehold.co/300x190?text=Posterior" },
  ],
};

function findSummaryById(id: number): RestaurantApplicationSummary | undefined {
  return [...ACCEPTED, ...PENDING, ...REJECTED].find((item) => item.id === id);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class RestaurantApplicationsAdminService {
  /**
   * Obtiene el conteo de solicitudes por estado, para los tabs.
   * TODO: reemplazar por GET /api/admin/restaurant-applications/counts
   */
  async getCounts(): Promise<Record<AdminApplicationStatus, number>> {
    return TOTALS;
  }

  /**
   * Obtiene una página de solicitudes para un estado dado.
   * TODO: reemplazar por GET /api/admin/restaurant-applications?status=&page=
   */
  async getByStatus(
    status: AdminApplicationStatus,
    page: number = 1
  ): Promise<PaginatedResult> {
    const all = DATA[status];
    const total = TOTALS[status];
    const start = (page - 1) * PAGE_SIZE;
    const items = all.slice(start, start + PAGE_SIZE);

    return {
      items,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      page,
    };
  }

  /**
   * Obtiene el detalle completo de una solicitud por id.
   * TODO: reemplazar por GET /api/admin/restaurant-applications/:id
   */
  async getById(id: number): Promise<RestaurantApplicationDetail> {
    await delay(300);
    const summary = findSummaryById(id);
    if (!summary) {
      throw new Error(`Solicitud ${id} no encontrada`);
    }
    return { ...summary, ...MOCK_DETAIL_EXTRA };
  }

  /**
   * Aprueba una solicitud.
   * TODO: reemplazar por POST /api/admin/restaurant-applications/:id/approve
   */
  async approve(id: number): Promise<void> {
    await delay(300);
  }

  /**
   * Rechaza una solicitud.
   * TODO: reemplazar por POST /api/admin/restaurant-applications/:id/reject
   */
  async reject(id: number): Promise<void> {
    await delay(300);
  }
}

export default new RestaurantApplicationsAdminService();