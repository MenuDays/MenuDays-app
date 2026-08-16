import { api } from "./api";

export type ReportStatus = "pendiente" | "archivado" | "resuelto";

export interface ReportReason {
  id: number;
  nombre: string;
}

export interface ReportItem {
  id: number;
  estado: ReportStatus;
  descripcion: string | null;
  createdAt: string;
  reviewedAt: string | null;
  motivo: string;
  restaurant: {
    id: number;
    nombreComercial: string;
    estadoCuenta?: string;
    logoUrl?: string | null;
  };
  reporter: {
    id: number;
    nombre: string;
    apellido: string;
    email?: string;
  };
  reviewedBy: {
    id: number;
    nombre: string;
    apellido: string;
  } | null;
}

function mapReport(r: any): ReportItem {
  return {
    id: Number(r.id),
    estado: r.estado,
    descripcion: r.descripcion,
    createdAt: r.created_at,
    reviewedAt: r.revisado_at,
    motivo: r.motivos_reporte?.nombre ?? "Otro",
    restaurant: {
      id: Number(r.restaurantes?.id),
      nombreComercial: r.restaurantes?.nombre_comercial,
      estadoCuenta: r.restaurantes?.estado_cuenta,
      logoUrl: r.restaurantes?.logo_url,
    },
    reporter: {
      id: Number(r.usuarios_reportes_usuario_idTousuarios?.id),
      nombre: r.usuarios_reportes_usuario_idTousuarios?.nombre,
      apellido: r.usuarios_reportes_usuario_idTousuarios?.apellido,
      email: r.usuarios_reportes_usuario_idTousuarios?.email,
    },
    reviewedBy: r.usuarios_reportes_revisado_porTousuarios
      ? {
          id: Number(r.usuarios_reportes_revisado_porTousuarios.id),
          nombre: r.usuarios_reportes_revisado_porTousuarios.nombre,
          apellido: r.usuarios_reportes_revisado_porTousuarios.apellido,
        }
      : null,
  };
}

class ReportService {
  /** Motivos de reporte disponibles (comensal). */
  async getReasons(): Promise<ReportReason[]> {
    const data = await api<any[]>("/reports/motivos");
    return data.map((m) => ({ id: Number(m.id), nombre: m.nombre }));
  }

  /** Reportar un restaurante (comensal). */
  async create(restauranteId: number, motivoId: number, descripcion?: string): Promise<void> {
    await api("/reports", {
      method: "POST",
      body: JSON.stringify({
        restauranteId,
        motivoId,
        descripcion: descripcion?.trim() || undefined,
      }),
    });
  }

  /** Listado de reportes (admin). */
  async getAll(): Promise<ReportItem[]> {
    const data = await api<any[]>("/admin/reports");
    return data.map(mapReport);
  }

  /** Detalle de un reporte (admin). */
  async getById(id: number): Promise<ReportItem> {
    const data = await api<any>(`/admin/reports/${id}`);
    return mapReport(data);
  }

  /** Gestionar un reporte: archivar o resolver (admin). */
  async updateStatus(id: number, estado: "archivado" | "resuelto"): Promise<ReportItem> {
    const data = await api<any>(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
    return mapReport(data);
  }
}

export default new ReportService();
