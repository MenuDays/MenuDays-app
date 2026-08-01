import { api } from "./api";

// Igual al enum estado_operativo_rest de Prisma en el backend.
export type RestaurantOperationalStatus =
  | "abierto"
  | "cerrado"
  | "cerrado_temporal"
  | "vacaciones";

export interface FavoriteCategory {
  id: number;
  nombre: string;
  iconoUrl: string | null;
}

export interface FavoriteRestaurant {
  id: number;
  nombreComercial: string;
  descripcion: string | null;
  direccion: string | null;
  logoUrl: string | null;
  portadaUrl: string | null;
  calificacionPromedio: number;
  cantidadResenas: number;
  estadoOperativo: RestaurantOperationalStatus;
  ciudad: string | null;
  categorias: FavoriteCategory[];
}

export interface FavoriteItem {
  // id del registro "favorito" en sí (no del restaurante).
  favoriteId: number;
  createdAt: string;
  restaurant: FavoriteRestaurant;
}

/**
 * Forma cruda que devuelve GET /favorites: cada fila es un
 * "favorito" con el restaurante completo anidado (ver
 * FavoritesService.findAll en el backend).
 */
interface RawFavorite {
  id: number | string;
  created_at: string;
  restaurantes: {
    id: number | string;
    nombre_comercial: string;
    descripcion: string | null;
    direccion: string | null;
    logo_url: string | null;
    portada_url: string | null;
    calificacion_promedio: number | string;
    cantidad_resenas: number;
    estado_operativo: RestaurantOperationalStatus;
    ciudad: { id: number | string; nombre: string } | null;
    restaurante_categorias: {
      categoria: {
        id: number | string;
        nombre: string;
        iconos: { id: number | string; nombre: string; url: string } | null;
      };
    }[];
  };
}

function mapFavorite(raw: RawFavorite): FavoriteItem {
  const r = raw.restaurantes;
  return {
    favoriteId: Number(raw.id),
    createdAt: raw.created_at,
    restaurant: {
      id: Number(r.id),
      nombreComercial: r.nombre_comercial,
      descripcion: r.descripcion,
      direccion: r.direccion,
      logoUrl: r.logo_url,
      portadaUrl: r.portada_url,
      calificacionPromedio: Number(r.calificacion_promedio) || 0,
      cantidadResenas: r.cantidad_resenas,
      estadoOperativo: r.estado_operativo,
      ciudad: r.ciudad?.nombre ?? null,
      categorias: r.restaurante_categorias.map((rc) => ({
        id: Number(rc.categoria.id),
        nombre: rc.categoria.nombre,
        iconoUrl: rc.categoria.iconos?.url ?? null,
      })),
    },
  };
}

class FavoriteService {
  /**
   * Obtiene los restaurantes favoritos del usuario autenticado.
   */
  async getAll(): Promise<FavoriteItem[]> {
    const data = await api<RawFavorite[]>("/favorites");
    return data.map(mapFavorite);
  }

  /**
   * Agrega un restaurante a favoritos.
   */
  async add(restaurantId: number): Promise<void> {
    await api(`/favorites/${restaurantId}`, { method: "POST" });
  }

  /**
   * Quita un restaurante de favoritos.
   */
  async remove(restaurantId: number): Promise<{ message: string }> {
    return api(`/favorites/${restaurantId}`, { method: "DELETE" });
  }
}

export default new FavoriteService();