import { api } from "./api";

// Igual al enum notificacion_tipo de Prisma en el backend.
export type NotificationType =
  | "solicitud_nueva"
  | "solicitud_aprobada"
  | "solicitud_rechazada"
  | "pedido_aceptado"
  | "pedido_rechazado"
  | "pedido_estado"
  | "pedido_listo"
  | "restaurante_suspendido"
  | "recuperacion_password";

export interface NotificationItem {
  id: number;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  referenciaTipo: string | null;
  referenciaId: number | null;
  createdAt: string;
}

interface RawNotification {
  id: number | string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  referencia_tipo: string | null;
  referencia_id: number | string | null;
  created_at: string;
}

function mapNotification(raw: RawNotification): NotificationItem {
  return {
    id: Number(raw.id),
    tipo: raw.tipo,
    titulo: raw.titulo,
    mensaje: raw.mensaje,
    leida: raw.leida,
    referenciaTipo: raw.referencia_tipo,
    referenciaId: raw.referencia_id != null ? Number(raw.referencia_id) : null,
    createdAt: raw.created_at,
  };
}

class NotificationService {
  /**
   * Lista las notificaciones del usuario autenticado, más recientes
   * primero.
   */
  async getAll(): Promise<NotificationItem[]> {
    const data = await api<RawNotification[]>("/notifications");
    return data.map(mapNotification);
  }

  /**
   * Cantidad de notificaciones no leídas -- para el badge.
   */
  async getUnreadCount(): Promise<number> {
    const data = await api<{ count: number }>("/notifications/unread-count");
    return data.count;
  }

  /**
   * Marca una notificación puntual como leída.
   */
  async markAsRead(id: number): Promise<void> {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
  }

  /**
   * Marca todas las notificaciones del usuario como leídas.
   */
  async markAllAsRead(): Promise<void> {
    await api("/notifications/read-all", { method: "PATCH" });
  }
}

export default new NotificationService();
