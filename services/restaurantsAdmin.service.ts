import { api } from "./api";

export type RestaurantAccountStatus = "activo" | "suspendido" | "eliminado";

export interface AdminRestaurantSummary {
  id: number;
  nombreComercial: string;
  logoUrl: string | null;
  estadoCuenta: RestaurantAccountStatus;
  estadoOperativo: string;
  ciudad: string | null;
  calificacionPromedio: number;
  cantidadResenas: number;
  cantidadReportes: number;
  createdAt: string;
}

export interface AdminRestaurantDetail extends AdminRestaurantSummary {
  descripcion: string | null;
  direccion: string;
  portadaUrl: string | null;
  provincia: string | null;
  cantidadPedidos: number;
}

function mapSummary(r: any): AdminRestaurantSummary {
  return {
    id: Number(r.id),
    nombreComercial: r.nombre_comercial,
    logoUrl: r.logo_url,
    estadoCuenta: r.estado_cuenta,
    estadoOperativo: r.estado_operativo,
    ciudad: r.ciudad?.nombre ?? null,
    calificacionPromedio: Number(r.calificacion_promedio ?? 0),
    cantidadResenas: r.cantidad_resenas ?? 0,
    cantidadReportes: r._count?.reportes ?? 0,
    createdAt: r.created_at,
  };
}

class RestaurantsAdminService {
  /** Listado de restaurantes (admin). */
  async getAll(filters?: { estado?: RestaurantAccountStatus; name?: string }): Promise<AdminRestaurantSummary[]> {
    const params = new URLSearchParams();
    if (filters?.estado) params.set("estado", filters.estado);
    if (filters?.name) params.set("name", filters.name);
    const qs = params.toString();

    const data = await api<any[]>(`/admin/restaurants${qs ? `?${qs}` : ""}`);
    return data.map(mapSummary);
  }

  /** Detalle de un restaurante (admin). */
  async getById(id: number): Promise<AdminRestaurantDetail> {
    const r = await api<any>(`/admin/restaurants/${id}`);
    return {
      ...mapSummary(r),
      descripcion: r.descripcion,
      direccion: r.direccion,
      portadaUrl: r.portada_url,
      provincia: r.ciudad?.provincia?.nombre ?? null,
      cantidadPedidos: r._count?.pedidos ?? 0,
    };
  }

  /** Pausar (suspender), reactivar o eliminar un restaurante (admin). */
  async updateStatus(id: number, estado: RestaurantAccountStatus): Promise<void> {
    await api(`/admin/restaurants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  }
}

export default new RestaurantsAdminService();
