import { api } from "./api";

export interface Promotion {
  id: string;
  restaurante_id: string;
  categoria_id: string | null;
  titulo: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionFormInput {
  titulo: string;
  descripcion?: string;
  // requerido por @IsNumber @Min(0) en CreatePromotionDto (sin @IsOptional)
  precio: number;
  fechaInicio: string; // formato AAAA-MM-DD
  fechaFin: string; // formato AAAA-MM-DD
  // opcional en CreatePromotionDto (@IsOptional @IsInt @IsPositive)
  categoriaId?: string;
  // uri local de expo-image-picker. Requerida al crear (el backend
  // rechaza el POST sin imagen); opcional al editar.
  imageUri?: string | null;
}

function buildFormData(input: Partial<PromotionFormInput>): FormData {
  const formData = new FormData();
  if (input.titulo !== undefined) formData.append("titulo", input.titulo);
  if (input.descripcion !== undefined) formData.append("descripcion", input.descripcion);
  if (input.precio !== undefined) formData.append("precio", String(input.precio));
  if (input.fechaInicio !== undefined) formData.append("fechaInicio", input.fechaInicio);
  if (input.fechaFin !== undefined) formData.append("fechaFin", input.fechaFin);
  if (input.categoriaId !== undefined) formData.append("categoriaId", input.categoriaId);
  if (input.imageUri) {
    formData.append("image", {
      uri: input.imageUri,
      name: "promocion.jpg",
      type: "image/jpeg",
    } as any);
  }
  return formData;
}

class PromotionService {
  async getAll(): Promise<Promotion[]> {
    return api<Promotion[]>("/promotions");
  }

  async getById(id: string): Promise<Promotion> {
    return api<Promotion>(`/promotions/${id}`);
  }

  async create(input: PromotionFormInput): Promise<Promotion> {
    return api<Promotion>("/promotions", {
      method: "POST",
      body: buildFormData(input),
    });
  }

  async update(id: string, input: Partial<PromotionFormInput>): Promise<Promotion> {
    return api<Promotion>(`/promotions/${id}`, {
      method: "PATCH",
      body: buildFormData(input),
    });
  }

  async toggle(id: string): Promise<{ message: string; activa: boolean }> {
    return api(`/promotions/${id}/toggle`, { method: "PATCH" });
  }

  async remove(id: string): Promise<{ message: string }> {
    return api(`/promotions/${id}`, { method: "DELETE" });
  }
}

export default new PromotionService();
