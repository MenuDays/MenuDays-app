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

class ReviewService {
  async getRestaurantReviews(restaurantId: string | number): Promise<Review[]> {
    return await api<Review[]>(`/restaurants/${restaurantId}/reviews`);
  }
}

export default new ReviewService();
