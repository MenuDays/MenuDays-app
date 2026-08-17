import { api } from "./api";

// ==========================================================================
// Colecciones de Menús -- agrupan exclusivamente los "menús del día" de UN
// restaurante (Entradas, Sopas, Menú Infantil, Postres + las que el
// restaurante cree). Concepto independiente de categorias/CategoryService
// (esas son la taxonomía global de cocina, compartida por platos/menús/
// promociones) -- ver menu_colecciones en el backend.
// ==========================================================================

export interface MenuCollection {
  id: string;
  restaurante_id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Cantidad de menús vigentes (no borrados) en la colección -- el back ya
  // la calcula con un _count de Prisma.
  _count?: { menus_del_dia: number };
}

class MenuCollectionService {
  async getAll(): Promise<MenuCollection[]> {
    return api<MenuCollection[]>("/menu-collections");
  }

  async create(nombre: string): Promise<MenuCollection> {
    return api<MenuCollection>("/menu-collections", {
      method: "POST",
      body: JSON.stringify({ nombre }),
    });
  }

  async update(id: string, nombre: string): Promise<MenuCollection> {
    return api<MenuCollection>(`/menu-collections/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ nombre }),
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    return api(`/menu-collections/${id}`, { method: "DELETE" });
  }
}

export default new MenuCollectionService();
