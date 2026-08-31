import { api } from "./api";

export interface Category {
  id: string;
  nombre: string;
  icono_id: string | null;
  iconos?: { url: string } | null;
}

// Mismo criterio que ProvinceService/LocationService (citiesCache): las
// categorías son datos de referencia casi estáticos (solo cambian cuando
// un admin agrega una nueva), así que se cachean en memoria durante la
// sesión. Sin esto, cada vez que el usuario volvía a la tab "Explorar"
// (o a Inicio) se repetía el fetch a GET /categories y se veía el
// spinner de nuevo, aunque los datos fueran a ser exactamente los mismos.
let categoriesCache: Category[] | null = null;

// El back no las devuelve en ningún orden particular (orden de creación),
// así que se ordenan acá antes de cachear/devolver -- afecta tanto al
// listado completo (getAll) como al de categorías propias del
// restaurante (getMyCategories), que son dos endpoints separados.
function sortByName(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

class CategoryService {
  async getAll(): Promise<Category[]> {
    if (categoriesCache) return categoriesCache;
    const data = await api<Category[]>("/categories");
    categoriesCache = sortByName(data);
    return categoriesCache;
  }

  // GET /restaurants/categories
  //      devuelve las categorías ya asociadas al restaurante autenticado,
  //      ej: [{ id: "3", nombre: "Pizzas", ... }, ...]
  async getMyCategories(): Promise<Category[]> {
    const data = await api<Category[]>("/restaurants/categories");
    return sortByName(data);
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
