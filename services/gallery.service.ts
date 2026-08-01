import { api } from "./api";

/**
 * Forma que usa la pantalla GalleryScreen.
 * `es_portada` mapea al `isCover` que devuelve el backend
 * (GalleryService.getGallery / uploadImage en Nest).
 */
export interface GalleryImage {
  id: string;
  url: string;
  es_portada: boolean;
  orden: number;
  created_at: string;
}

/**
 * Forma cruda que devuelve la API
 * (ver gallery.service.ts del backend).
 */
interface GalleryImageResponse {
  id: number | string;
  url: string;
  isCover: boolean;
  order: number;
  createdAt: string;
}

function mapImage(raw: GalleryImageResponse): GalleryImage {
  return {
    id: String(raw.id),
    url: raw.url,
    es_portada: raw.isCover,
    orden: raw.order,
    created_at: raw.createdAt,
  };
}

class GalleryService {
  /**
   * Obtiene todas las imágenes de la galería
   * del restaurante autenticado.
   */
  async getAll(): Promise<GalleryImage[]> {
    const data = await api<GalleryImageResponse[]>("/gallery");
    return data.map(mapImage);
  }

  /**
   * Sube una nueva imagen a la galería.
   * `uri` es la uri local devuelta por expo-image-picker.
   */
  async upload(uri: string): Promise<GalleryImage> {
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: "galeria.jpg",
      type: "image/jpeg",
    } as any);

    const data = await api<GalleryImageResponse>("/gallery", {
      method: "POST",
      body: formData,
    });

    return mapImage(data);
  }

  /**
   * Elimina una imagen de la galería.
   */
  async remove(id: string): Promise<{ message: string }> {
    return api(`/gallery/${id}`, { method: "DELETE" });
  }

  /**
   * Selecciona una imagen como portada.
   */
  async setCover(id: string): Promise<{ message: string }> {
    return api(`/gallery/${id}/cover`, { method: "PATCH" });
  }
}

export default new GalleryService();