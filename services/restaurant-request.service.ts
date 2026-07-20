import { api } from "./api";

export interface RestaurantRequestStatus {
  id: number;
  restaurantName: string;
  status: "pendiente" | "aprobada" | "rechazada";
  requestDate: string;
  adminObservations?: string | null;
}

class RestaurantRequestService {
  async getStatus(): Promise<RestaurantRequestStatus> {
    return api<RestaurantRequestStatus>(
      "/restaurant-requests/status"
    );
  }
}

export default new RestaurantRequestService();