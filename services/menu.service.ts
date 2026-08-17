import { api } from "./api";

// Igual al enum estado_publicacion de Prisma en el backend.
export type MenuStatus = "programado" | "publicado" | "oculto" | "agotado";

// Referencia mínima a la colección de menús a la que pertenece este menú
// (ver menu-collection.service.ts). Concepto independiente de categoria_id
// -- no confundir ambos.
export interface MenuCollectionRef {
  id: string;
  nombre: string;
  orden: number;
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
  created_at: string;
  updated_at: string;
}

export interface MenuFormInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  fechaInicio: string; // "YYYY-MM-DD", requerido por @IsDateString en el DTO
  fechaFin: string;
  // requerido por @IsInt @IsPositive en CreateMenuDto (sin @IsOptional)
  categoriaId: string;
  // Colección de menús (Entradas/Sopas/etc.) -- opcional a propósito, ver
  // coleccionId en CreateMenuDto del backend.
  coleccionId?: string;
  // uri local de expo-image-picker. Requerida al crear (el backend
  // rechaza el POST sin imagen); opcional al editar (si no se manda,
  // el backend conserva la imagen actual).
  imageUri?: string | null;
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
  if (input.imageUri) {
    formData.append("image", {
      uri: input.imageUri,
      name: "menu.jpg",
      type: "image/jpeg",
    } as any);
  }
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
}

export default new MenuService();