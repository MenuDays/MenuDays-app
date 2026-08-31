import { api } from "./api";

// Igual al enum estado_disponibilidad de Prisma en el backend.
export type DishStatus = "disponible" | "agotado";

export interface DishCategory {
  id: string;
  nombre: string;
  icono_id: string | null;
}

export interface DishImage {
  id: string;
  url: string;
  orden: number;
}

export interface Dish {
  id: string;
  restaurante_id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  estado: DishStatus;
  activo: boolean;
  // "Destacado" y "en oferta" son independientes entre sí -- ver
  // getMenuComponentGroups-style carruseles en la home del comensal.
  destacado: boolean;
  en_oferta: boolean;
  precio_oferta: number | null;
  created_at: string;
  updated_at: string;
  categorias: DishCategory;
  plato_imagenes: DishImage[];
}

export interface DishFormInput {
  nombre: string;
  // Requerida por @IsNotEmpty en CreateDishDto (a diferencia del menú,
  // acá el backend no la deja vacía).
  descripcion: string;
  precio: number;
  categoriaId: string;
  estado?: DishStatus;
  activo?: boolean;
  destacado?: boolean;
  enOferta?: boolean;
  // Precio con descuento -- solo tiene sentido si enOferta es true.
  // null limpia el valor guardado (ver update-dish.dto en el back).
  precioOferta?: number | null;
  // uri local de expo-image-picker. Requerida al crear (el backend
  // rechaza el POST sin imagen); opcional al editar (si no se manda,
  // el backend conserva la imagen actual).
  imageUri?: string | null;
}

function buildFormData(input: Partial<DishFormInput>): FormData {
  const formData = new FormData();
  if (input.nombre !== undefined) formData.append("nombre", input.nombre);
  if (input.descripcion !== undefined) formData.append("descripcion", input.descripcion);
  if (input.precio !== undefined) formData.append("precio", String(input.precio));
  if (input.categoriaId !== undefined) formData.append("categoriaId", input.categoriaId);
  if (input.estado !== undefined) formData.append("estado", input.estado);
  if (input.activo !== undefined) formData.append("activo", String(input.activo));
  if (input.destacado !== undefined) formData.append("destacado", String(input.destacado));
  if (input.enOferta !== undefined) formData.append("enOferta", String(input.enOferta));
  if (input.precioOferta !== undefined) {
    formData.append("precioOferta", input.precioOferta === null ? "" : String(input.precioOferta));
  }
  if (input.imageUri) {
    formData.append("image", {
      uri: input.imageUri,
      name: "plato.jpg",
      type: "image/jpeg",
    } as any);
  }
  return formData;
}

class DishService {
  async getAll(): Promise<Dish[]> {
    return api<Dish[]>("/dishes");
  }

  async getById(id: string): Promise<Dish> {
    return api<Dish>(`/dishes/${id}`);
  }

  async create(input: DishFormInput): Promise<Dish> {
    return api<Dish>("/dishes", {
      method: "POST",
      body: buildFormData(input),
    });
  }

  async update(id: string, input: Partial<DishFormInput>): Promise<Dish> {
    return api<Dish>(`/dishes/${id}`, {
      method: "PATCH",
      body: buildFormData(input),
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    return api(`/dishes/${id}`, { method: "DELETE" });
  }
}

export default new DishService();
