import { api } from "./api";

// Igual al enum estado_publicacion de Prisma en el backend.
// OJO: "programado" es el estado por default al crear un menú -- por
// ahora no hay forma de cambiarlo por API (ni CreateMenuDto ni
// UpdateMenuDto tienen campo "estado", y no existe un endpoint de
// toggle como el de promociones). Hasta que se agregue, el front no
// puede publicar/ocultar un menú manualmente.
export type MenuStatus = "programado" | "publicado" | "oculto" | "agotado";

export interface Menu {
  id: string;
  restaurante_id: string;
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
}

export default new MenuService();