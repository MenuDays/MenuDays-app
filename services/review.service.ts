import { api } from "./api";

// Shape tal cual la devuelve ReviewsService.findRestaurantReviews() en el
// backend (fila cruda de "resenas" + include de usuarios). OJO: el
// controller entero tiene @UseGuards(JwtAuthGuard) aunque el summary diga
// "reseñas públicas" -- hace falta estar logueado para pedirlas, el
// helper api() ya manda el token si existe.

export interface Review {
  id: number;
  usuario_id: number;
  restaurante_id: number;
  pedido_id: number;
  calificacion: number; // 1 a 5
  comentario: string | null;
  respuesta_restaurante: string | null;
  respuesta_at: string | null;
  estado: "visible" | "oculta" | "reportada";
  created_at: string;
  usuarios: {
    id: number;
    nombre: string;
    apellido: string;
    foto_perfil_url: string | null;
  };
}

export interface GetReviewsOptions {
  // El endpoint actual devuelve TODAS las reseñas de una (no pagina).
  // Si en el futuro el back agrega ?page&limit acá, esta función ya
  // los manda -- mientras tanto se pueden ignorar sin romper nada.
  page?: number;
  limit?: number;
}

// POST /reviews (ReviewsController.create): pedidoId + calificacion (1-5)
// + comentario opcional. El back valida ahí mismo que el pedido exista,
// sea del usuario logueado, esté "entregado", y no tenga ya una reseña
// -- si no cumple, tira 400/403/404 con el mensaje correspondiente, así
// que alcanza con propagar e.message en la UI, no hace falta duplicar
// esas validaciones acá.
export interface CreateReviewInput {
  pedidoId: string | number;
  calificacion: number;
  comentario?: string;
}

class ReviewService {
  async getRestaurantReviews(
    restaurantId: string | number,
    options: GetReviewsOptions = {}
  ): Promise<Review[]> {
    const params = new URLSearchParams();
    if (options.page != null) params.append("page", String(options.page));
    if (options.limit != null) params.append("limit", String(options.limit));
    const qs = params.toString();
    return await api<Review[]>(`/restaurants/${restaurantId}/reviews${qs ? `?${qs}` : ""}`);
  }

  async create(input: CreateReviewInput): Promise<Review> {
    return await api<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify({
        pedidoId: Number(input.pedidoId),
        calificacion: input.calificacion,
        comentario: input.comentario?.trim() ? input.comentario.trim() : undefined,
      }),
    });
  }
}

export default new ReviewService();