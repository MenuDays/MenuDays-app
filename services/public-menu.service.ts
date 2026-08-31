import { api } from "./api";

// ==========================================================================
// GET /public/menus -- menús del día vigentes y publicados, de restaurantes
// activos, dentro del mismo radio/filtros que Explore (PublicMenuController
// / PublicMenuService en el back). Pensado para la pestaña "Menús" del
// comensal: a diferencia de /menus (CRUD del restaurante dueño del menú),
// este es de solo lectura y ya viene con el restaurante embebido.
// Ver src/modules/public-menus en el back.
// ==========================================================================

export interface PublicMenuRestaurant {
  id: string;
  nombre_comercial: string;
  logo_url: string | null;
  estado_operativo: "abierto" | "cerrado" | "cerrado_temporal" | "vacaciones";
  calificacion_promedio: number;
  cantidad_resenas: number;
}

export interface PublicMenuCategory {
  id: string;
  nombre: string;
  icono_id: string | null;
  iconos?: { url: string } | null;
}

export interface PublicMenu {
  id: string;
  restaurante_id: string;
  categoria_id: string | null; // nullable: se agregó recién (migración del 10/08)
  nombre: string;
  descripcion: string | null;
  precio: number;
  foto_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado: "publicado"; // findAvailable solo devuelve publicados
  // Cada tipo puede tener varios nombres (ej. dos entradas distintas) --
  // el comensal los ve como checkboxes dentro de su tipo, ver
  // getMenuComponentGroups.
  componente_entrada: string[];
  componente_sopa: string[];
  componente_plato_fuerte: string[];
  componente_jugo: string[];
  componente_postre: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  restaurante: PublicMenuRestaurant;
  categorias: PublicMenuCategory | null; // el back ya incluye esta relación
  distancia?: number; // solo viene si se mandó latitude + longitude
}

// "Incluye: Entrada (Ensalada, Sopa de fideo), Postre (Flan)" -- resume
// qué trae el menú para el comensal, en el mismo orden fijo de siempre
// (Entrada/Sopa/Plato Fuerte/Jugo/Postre). Cada tipo puede listar más de
// un nombre.
const COMPONENT_LABELS: [keyof PublicMenu, string][] = [
  ["componente_entrada", "Entrada"],
  ["componente_sopa", "Sopa"],
  ["componente_plato_fuerte", "Plato Fuerte"],
  ["componente_jugo", "Jugo"],
  ["componente_postre", "Postre"],
];

export function getMenuComponentSummary(menu: PublicMenu): string | null {
  const parts = COMPONENT_LABELS.filter(([key]) => (menu[key] as string[]).length > 0).map(
    ([key, label]) => `${label} (${(menu[key] as string[]).join(", ")})`
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

export interface MenuComponentGroup {
  label: string;
  items: string[];
}

// Shape listo para renderizar la lista de checkboxes por tipo en el
// detalle del menú -- solo los tipos que el restaurante completó (los
// que quedaron vacíos/"Ninguno" ni aparecen).
export function getMenuComponentGroups(menu: PublicMenu): MenuComponentGroup[] {
  return COMPONENT_LABELS.filter(([key]) => (menu[key] as string[]).length > 0).map(
    ([key, label]) => ({ label, items: menu[key] as string[] })
  );
}

// Detalle: el back manda más datos del restaurante (dirección, ciudad,
// horarios, etc.) que el listado. Ver PublicMenuService.findOne.
export interface PublicMenuDetail extends Omit<PublicMenu, "restaurante"> {
  restaurante: PublicMenuRestaurant & {
    descripcion: string | null;
    direccion: string | null;
    portada_url: string | null;
    ubicacion_lat: number;
    ubicacion_lng: number;
    ciudad: {
      id: string;
      nombre: string;
      provincia: { id: string; nombre: string };
    } | null;
    restaurante_horarios: unknown[];
  };
}

// Mismos filtros que ExploreService.findRestaurants (FindPublicMenusDto
// extiende FindRestaurantsDto en el back para que ambos listados usen el
// mismo radio).
export interface FindPublicMenusFilters {
  // Matchea el campo `nombre` de menus_del_dia (el menú del día en sí,
  // ej. "Seco de pollo"). NO busca en el catálogo de `platos` (otra
  // entidad, sin relación en Prisma) ni en el nombre del restaurante
  // (eso ya lo cubre ExploreService/RestaurantesScreen).
  search?: string;
  provinceId?: number | string;
  cityId?: number | string;
  radius?: number;
  latitude?: number;
  longitude?: number;
  // Palabra clave (chip) exacta que el restaurante haya cargado en su
  // menú -- ver PublicMenuService.findMatchingTags para el autocompletado.
  tag?: string;
}

class PublicMenuService {
  async findAvailable(filters: FindPublicMenusFilters = {}): Promise<PublicMenu[]> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.provinceId != null) params.append("provinceId", String(filters.provinceId));
    if (filters.cityId != null) params.append("cityId", String(filters.cityId));
    if (filters.radius != null) params.append("radius", String(filters.radius));
    if (filters.latitude != null) params.append("latitude", String(filters.latitude));
    if (filters.longitude != null) params.append("longitude", String(filters.longitude));
    if (filters.tag) params.append("tag", filters.tag);

    const qs = params.toString();
    return await api<PublicMenu[]>(`/public/menus${qs ? `?${qs}` : ""}`);
  }

  async findOne(id: string): Promise<PublicMenuDetail> {
    return await api<PublicMenuDetail>(`/public/menus/${id}`);
  }

  // Autocompletado de tags para el buscador de "Explorar" -- devuelve
  // tags que algún restaurante ya usó en un menú vigente, filtrados por
  // substring (case-insensitive). Ver PublicMenuController#findMatchingTags.
  async findMatchingTags(search: string): Promise<string[]> {
    const query = search.trim();
    if (!query) return [];
    return await api<string[]>(`/public/menus/tags?search=${encodeURIComponent(query)}`);
  }
}

export default new PublicMenuService();