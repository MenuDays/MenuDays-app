import { api } from "./api";
import { StatCardData, RankingRow } from "../app/components/admin/types";

// --- Shape crudo devuelto por GET /admin/dashboard (ver DashboardService en el backend) ---

interface RawDashboardResponse {
  usuarios: {
    total: number;
    comensales: number;
    restaurantes: number;
    administradores: number;
  };
  restaurantes: {
    activos: number;
    suspendidos: number;
    eliminados: number;
    solicitudes: {
      total: number;
      aceptadas: number;
      pendientes: number;
      rechazadas: number;
    };
  };
  solicitudes: {
    total: number;
    pendientes: number;
    aceptadas: number;
    rechazadas: number;
  };
  menus: { total: number; activosHoy: number };
  platos: { total: number };
  promociones: { total: number; activas: number };
  reportes: { pendientes: number; resueltos: number };
  reviews: { total: number };
  favoritos: { total: number };
  topReportes: { id?: number; nombre?: string; reportes: number }[];
  topResenas: { id?: number; nombre?: string; resenas: number }[];
  weeklyRequests: { fecha: string; total: number }[];
  growth: {
    semanaAnterior: number;
    semanaActual: number;
    diferencia: number;
    porcentaje: number;
  };
}

// --- Shape que consume la pantalla ---

export interface AdminDashboardViewModel {
  overview: {
    totalValue: number;
    growthLabel: string;
    weeklyData: number[];
    weeklyLabels: string[];
  };
  stats: StatCardData[];
  topReportes: RankingRow[];
  topResenas: RankingRow[];
}

const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"]; // getUTCDay(): 0=domingo

function formatPercentage(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

class AdminDashboardService {
  async getDashboard(): Promise<AdminDashboardViewModel> {
    const data = await api<RawDashboardResponse>("/admin/dashboard");

    const totalRestaurantes =
      data.restaurantes.activos +
      data.restaurantes.suspendidos +
      data.restaurantes.eliminados;

    const totalReportes = data.reportes.pendientes + data.reportes.resueltos;

    const stats: StatCardData[] = [
      {
        icon: "restaurant",
        title: "Restaurantes",
        value: String(totalRestaurantes),
        breakdown: [
          { label: "Activos", value: data.restaurantes.activos, color: "#4CAF50" },
          { label: "Suspendidos", value: data.restaurantes.suspendidos, color: "#F5A800" },
          { label: "Eliminados", value: data.restaurantes.eliminados, color: "#E53935" },
        ],
      },
      {
        icon: "people",
        title: "Comensales",
        value: String(data.usuarios.comensales),
        subtitle: "Registrados en total",
      },
      {
        icon: "clipboard",
        title: "Solicitudes",
        value: String(data.solicitudes.total),
        breakdown: [
          { label: "Aceptadas", value: data.solicitudes.aceptadas, color: "#4CAF50" },
          { label: "Pendientes", value: data.solicitudes.pendientes, color: "#F5A800" },
          { label: "Rechazadas", value: data.solicitudes.rechazadas, color: "#E53935" },
        ],
        trend: formatPercentage(data.growth.porcentaje),
        trendPositive: data.growth.diferencia >= 0,
      },
      {
        icon: "alert-circle",
        title: "Reportes",
        value: String(totalReportes),
        subtitle: "Registrados en total",
        ...(data.reportes.pendientes > 0 && {
          trend: `${data.reportes.pendientes} pendientes`,
          trendPositive: false,
        }),
      },
    ];

    const weeklyData = data.weeklyRequests.map((d) => d.total);
    const weeklyLabels = data.weeklyRequests.map((d) => {
      const day = new Date(`${d.fecha}T00:00:00Z`).getUTCDay();
      return DAY_LETTERS[day];
    });

    const topReportes: RankingRow[] = data.topReportes.map((r, i) => ({
      position: i + 1,
      name: r.nombre ?? "Restaurante",
      value: r.reportes,
      id: r.id,
    }));

    const topResenas: RankingRow[] = data.topResenas.map((r, i) => ({
      position: i + 1,
      name: r.nombre ?? "Restaurante",
      value: r.resenas,
      id: r.id,
    }));

    return {
      overview: {
        totalValue: data.growth.semanaActual,
        growthLabel: formatPercentage(data.growth.porcentaje),
        weeklyData,
        weeklyLabels,
      },
      stats,
      topReportes,
      topResenas,
    };
  }
}

export default new AdminDashboardService();
