import { api } from "./api";

export interface Category {
  id: string;
  nombre: string;
  icono_id: string | null;
  iconos?: { url: string } | null;
}

class CategoryService {
  async getAll(): Promise<Category[]> {
    return api<Category[]>("/categories");
  }

  // estos dos todavía no existen en el backend (no hay módulo para
  // restaurante_categoria), quedan acá listos para cuando el back los
  // implemente. Mientras tanto van a tirar 404.
  //
  // GET /restaurants/categories
  //      debería devolver las categorías ya asociadas al restaurante
  //      autenticado, ej: [{ id: "3", nombre: "Pizzas", ... }, ...]
  //
  // PUT /restaurants/categories  body: { categoriaIds: string[] }
  //      debería reemplazar por completo las categorías asociadas al
  //      restaurante autenticado con la lista recibida.
  async getRestaurantCategories(): Promise<string[]> {
    const data = await api<Category[]>("/restaurants/categories");
    return data.map((c) => c.id);
  }

  async updateRestaurantCategories(categoryIds: string[]): Promise<void> {
    await api("/restaurants/categories", {
      method: "PUT",
      body: JSON.stringify({ categoriaIds: categoryIds }),
    });
  }
}

export default new CategoryService();
