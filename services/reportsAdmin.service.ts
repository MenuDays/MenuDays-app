import { api } from "./api";

// ==========================================================================
// Admin -- Moderación de reportes. Conectado a los endpoints reales del
// back (ReportsController): GET /admin/reports, GET /admin/reports/:id,
// PATCH /admin/reports/:id. A diferencia de las solicitudes de
// restaurante, acá NO hay paginación ni filtro por query param en el
// back -- findAll() devuelve todo, así que el filtro por estado (para
// los tabs) se hace del lado del front.
// ==========================================================================

export type ReportStatus = "pendiente" | "archivado" | "resuelto";

export interface ReportListItem {
  id: string;
  estado: ReportStatus;
  descripcion: string | null;
  motivo: string;
  restaurante: { id: string; nombre: string };
  usuario: { id: string; nombreCompleto: string };
  createdAt: string;
}

export interface ReportDetail extends ReportListItem {
  usuarioEmail: string;
  restauranteEstadoCuenta: string;
  revisadoPor: string | null;
  revisadoAt: string | null;
}

// Shape crudo tal cual lo devuelve ReportsService (Prisma include) en el
// backend -- ids vienen serializados como string (BigInt), igual que en
// order.service.ts.
interface RawReport {
  id: string;
  descripcion: string | null;
  estado: ReportStatus;
  created_at: string;
  revisado_at: string | null;
  motivos_reporte: { id: string; nombre: string };
  restaurantes: {
    id: string;
    nombre_comercial: string;
    estado_cuenta?: string;
  };
  usuarios_reportes_usuario_idTousuarios: {
    id: string;
    nombre: string;
    apellido: string;
    email?: string;
  };
  usuarios_reportes_revisado_porTousuarios: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
}

function mapListItem(r: RawReport): ReportListItem {
  return {
    id: String(r.id),
    estado: r.estado,
    descripcion: r.descripcion,
    motivo: r.motivos_reporte?.nombre ?? "Sin motivo",
    restaurante: {
      id: String(r.restaurantes?.id),
      nombre: r.restaurantes?.nombre_comercial ?? "Restaurante",
    },
    usuario: {
      id: String(r.usuarios_reportes_usuario_idTousuarios?.id),
      nombreCompleto: [
        r.usuarios_reportes_usuario_idTousuarios?.nombre,
        r.usuarios_reportes_usuario_idTousuarios?.apellido,
      ]
        .filter(Boolean)
        .join(" "),
    },
    createdAt: r.created_at,
  };
}

function mapDetail(r: RawReport): ReportDetail {
  return {
    ...mapListItem(r),
    usuarioEmail: r.usuarios_reportes_usuario_idTousuarios?.email ?? "",
    restauranteEstadoCuenta: r.restaurantes?.estado_cuenta ?? "",
    revisadoPor: r.usuarios_reportes_revisado_porTousuarios
      ? [
          r.usuarios_reportes_revisado_porTousuarios.nombre,
          r.usuarios_reportes_revisado_porTousuarios.apellido,
        ]
          .filter(Boolean)
          .join(" ")
      : null,
    revisadoAt: r.revisado_at,
  };
}

class ReportsAdminService {
  async getAll(): Promise<ReportListItem[]> {
    const raw = await api<RawReport[]>("/admin/reports");
    return raw.map(mapListItem);
  }

  async getById(id: string | number): Promise<ReportDetail> {
    const raw = await api<RawReport>(`/admin/reports/${id}`);
    return mapDetail(raw);
  }

  async updateStatus(id: string | number, estado: ReportStatus): Promise<void> {
    await api(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  }
}

export default new ReportsAdminService();