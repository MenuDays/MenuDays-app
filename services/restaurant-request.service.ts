import { api } from "./api";

export interface RestaurantRequestStatus {
  id: number;
  restaurantName: string;
  status: "pendiente" | "aprobada" | "rechazada";
  requestDate: string;
  adminObservations?: string | null;
}

export interface CreateRestaurantRequestPayload {
  commercialName: string;
  description?: string;
  address: string;
  provinceId: number;
  cityId: number;
  latitude: number;
  longitude: number;
  contactPhone: string;
  socialNetworks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  logo: { uri: string; name: string; type: string };
  cedulaFront: { uri: string; name: string; type: string };
  cedulaBack: { uri: string; name: string; type: string };
}

class RestaurantRequestService {
  async getStatus(): Promise<RestaurantRequestStatus> {
    return api<RestaurantRequestStatus>("/restaurant-requests/status");
  }

  async create(payload: CreateRestaurantRequestPayload) {
    const form = new FormData();

    form.append("commercialName", payload.commercialName);
    if (payload.description) form.append("description", payload.description);
    form.append("address", payload.address);
    form.append("provinceId", String(payload.provinceId));
    form.append("cityId", String(payload.cityId));
    form.append("latitude", String(payload.latitude));
    form.append("longitude", String(payload.longitude));
    form.append("contactPhone", payload.contactPhone);

    if (payload.socialNetworks) {
      form.append("socialNetworks", JSON.stringify(payload.socialNetworks));
    }

    // React Native: los archivos van como objeto {uri, name, type}, no como Blob
    form.append("logo", payload.logo as any);
    form.append("cedulaFront", payload.cedulaFront as any);
    form.append("cedulaBack", payload.cedulaBack as any);

    return api("/restaurant-requests", {
      method: "POST",
      body: form,
    });
  }
}

export default new RestaurantRequestService();