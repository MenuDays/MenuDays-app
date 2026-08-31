import { api } from "./api";

// Igual al enum estado_publicacion de Prisma en el backend.
export type MenuStatus = "programado" | "publicado" | "oculto" | "agotado";

// Igual al enum tipo_programacion_menu de Prisma en el backend.
export type MenuScheduleType = "hoy" | "fecha" | "semanal";

// Referencia mínima a la colección de menús a la que pertenece este menú
// (ver menu-collection.service.ts). Concepto independiente de categoria_id
// -- no confundir ambos. Se mantiene por compatibilidad con menús viejos;
// los menús nuevos ya no se crean con esto (ver componentes más abajo).
export interface MenuCollectionRef {
  id: string;
  nombre: string;
  orden: number;
}

// Los 5 "platos" internos de un menú compuesto -- cada tipo admite
// VARIOS nombres ([] = el restaurante no completó ese tipo), ej. dos
// entradas distintas el mismo día. Un mismo menú puede tener varios
// tipos completos a la vez (ej. entrada Y postre).
export interface MenuComponents {
  entrada: string[];
  sopa: string[];
  platoFuerte: string[];
  jugo: string[];
  postre: string[];
}

export interface Menu {
  id: string;
  restaurante_id: string;
  categoria_id: string | null;
  coleccion_id: string | null;
  menu_colecciones: MenuCollectionRef | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  foto_url: string | null;
  fecha_inicio: string; // "YYYY-MM-DD"
  fecha_fin: string;
  estado: MenuStatus;
  componente_entrada: string[];
  componente_sopa: string[];
  componente_plato_fuerte: string[];
  componente_jugo: string[];
  componente_postre: string[];
  tags: string[];
  tipo_programacion: MenuScheduleType;
  dias_semana: number[]; // 1=Lunes ... 7=Domingo
  created_at: string;
  updated_at: string;
}

// Devuelve los componentes de un menú en un shape más cómodo para la UI
// (camelCase, agrupados) en vez de tener que repetir
// menu.componente_plato_fuerte, etc. en cada pantalla.
export function getMenuComponents(menu: Menu): MenuComponents {
  return {
    entrada: menu.componente_entrada,
    sopa: menu.componente_sopa,
    platoFuerte: menu.componente_plato_fuerte,
    jugo: menu.componente_jugo,
    postre: menu.componente_postre,
  };
}

export interface MenuFormInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  fechaInicio: string; // "YYYY-MM-DD", requerido por @IsDateString en el DTO
  fechaFin: string;
  // requerido por @IsInt @IsPositive en CreateMenuDto (sin @IsOptional)
  categoriaId: string;
  // Colección de menús -- ya no se usa para crear menús nuevos, se deja
  // por compatibilidad con el form de edición viejo (menu/form.tsx).
  coleccionId?: string;
  // uri local de expo-image-picker. Opcional tanto al crear como al
  // editar -- el back ya acepta el POST/PATCH sin imagen.
  imageUri?: string | null;
  // Para marcar "sin stock" (agotado) puntualmente vía PATCH normal, sin
  // pasar por /toggle (que solo alterna publicado<->oculto).
  estado?: MenuStatus;

  componenteEntrada?: string[];
  componenteSopa?: string[];
  componentePlatoFuerte?: string[];
  componenteJugo?: string[];
  componentePostre?: string[];
  tags?: string[];
  tipoProgramacion?: MenuScheduleType;
  diasSemana?: number[]; // 1=Lunes ... 7=Domingo, solo si tipoProgramacion="semanal"
}

function buildFormData(input: Partial<MenuFormInput>): FormData {
  const formData = new FormData();
  if (input.nombre !== undefined) formData.append("nombre", input.nombre);
  if (input.descripcion) formData.append("descripcion", input.descripcion);
  if (input.precio !== undefined) formData.append("precio", String(input.precio));
  if (input.fechaInicio) formData.append("fechaInicio", input.fechaInicio);
  if (input.fechaFin) formData.append("fechaFin", input.fechaFin);
  if (input.categoriaId !== undefined) formData.append("categoriaId", input.categoriaId);
  if (input.coleccionId !== undefined) formData.append("coleccionId", input.coleccionId);
  if (input.estado !== undefined) formData.append("estado", input.estado);
  if (input.imageUri) {
    formData.append("image", {
      uri: input.imageUri,
      name: "menu.jpg",
      type: "image/jpeg",
    } as any);
  }
  if (input.componenteEntrada !== undefined) formData.append("componenteEntrada", JSON.stringify(input.componenteEntrada));
  if (input.componenteSopa !== undefined) formData.append("componenteSopa", JSON.stringify(input.componenteSopa));
  if (input.componentePlatoFuerte !== undefined) formData.append("componentePlatoFuerte", JSON.stringify(input.componentePlatoFuerte));
  if (input.componenteJugo !== undefined) formData.append("componenteJugo", JSON.stringify(input.componenteJugo));
  if (input.componentePostre !== undefined) formData.append("componentePostre", JSON.stringify(input.componentePostre));
  if (input.tags !== undefined) formData.append("tags", JSON.stringify(input.tags));
  if (input.tipoProgramacion !== undefined) formData.append("tipoProgramacion", input.tipoProgramacion);
  if (input.diasSemana !== undefined) formData.append("diasSemana", JSON.stringify(input.diasSemana));
  return formData;
}

class MenuService {
  async getAll(): Promise<Menu[]> {
    return api<Menu[]>("/menus");
  }

  async getById(id: string): Promise<Menu> {
    return api<Menu>(`/menus/${id}`);
  }

  async create(input: MenuFormInput): Promise<Menu> {
    return api<Menu>("/menus", {
      method: "POST",
      body: buildFormData(input),
    });
  }

  async update(id: string, input: Partial<MenuFormInput>): Promise<Menu> {
    return api<Menu>(`/menus/${id}`, {
      method: "PATCH",
      body: buildFormData(input),
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    return api(`/menus/${id}`, { method: "DELETE" });
  }

  // Publica/oculta el menú alternando su estado (programado|oculto <->
  // publicado). Requiere PATCH /menus/:id/toggle en el back -- ver
  // PromotionController/PromotionService.toggle como referencia del
  // mismo patrón ya implementado para promociones.
  async toggle(id: string): Promise<Menu> {
    return api<Menu>(`/menus/${id}/toggle`, { method: "PATCH" });
  }

  // Duplica un menú ya creado (para reutilizarlo sin cargarlo de cero).
  // La copia nace OCULTA y programada para "hoy". Requiere
  // POST /menus/:id/duplicar en el back.
  async duplicate(id: string): Promise<Menu> {
    return api<Menu>(`/menus/${id}/duplicar`, { method: "POST" });
  }

  // "Los menús de hoy son estos": manda la lista de ids elegidos con
  // checkbox. El back publica esos (vigentes hoy) y oculta los que
  // estaban como menú de hoy y ya no están en la lista. Devuelve la
  // lista completa actualizada. Requiere PATCH /menus/aplicar-hoy.
  async setTodayMenus(ids: string[]): Promise<Menu[]> {
    return api<Menu[]>("/menus/aplicar-hoy", {
      method: "PATCH",
      body: JSON.stringify({ ids: ids.map((id) => Number(id)) }),
    });
  }
}

export default new MenuService();