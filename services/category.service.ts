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

  // GET /restaurants/categories
  //      devuelve las categorías ya asociadas al restaurante autenticado,
  //      ej: [{ id: "3", nombre: "Pizzas", ... }, ...]
  async getMyCategories(): Promise<Category[]> {
    return api<Category[]>("/restaurants/categories");
  }

  // Igual que getMyCategories pero solo los ids, para preseleccionar el
  // picker de elegir-categorias.tsx.
  async getRestaurantCategories(): Promise<string[]> {
    const data = await this.getMyCategories();
    return data.map((c) => c.id);
  }

  // PUT /restaurants/categories  body: { categoryIds: number[] }
  //      reemplaza por completo las categorías asociadas al restaurante
  //      autenticado con la lista recibida. OJO: el DTO del backend
  //      (UpdateRestaurantCategoriesDto) espera la clave "categoryIds"
  //      en inglés, no "categoriaIds".
  async updateRestaurantCategories(categoryIds: string[]): Promise<void> {
    await api("/restaurants/categories", {
      method: "PUT",
      body: JSON.stringify({ categoryIds: categoryIds.map(Number) }),
    });
  }
}

export default new CategoryService();
