import { api } from "./api";
import RestaurantService from "./restaurant.service";

// ==========================================================================
// Conectado a los endpoints reales del back (antes esto estaba mockeado).
//
// - POST /orders          -- ya soporta menuId/dishId/promotionId +
//   metodoEntrega (DELIVERY | RETIRO_EN_LOCAL). Responde solo un resumen
//   (id, estado, tipo, metodoEntrega, fechaPedido, total), no el pedido
//   completo con restaurante/producto embebidos.
// - GET /orders/:id       -- sí trae el detalle completo (restaurante,
//   producto, medio de entrega, etc.), así que create() encadena un
//   fetch acá para armar el objeto "Order" que espera la UI.
// - GET /orders/:id/whatsapp-summary -- el back arma el texto real, ya
//   no hace falta el mock ni el fallback local salvo que falle el fetch.
// - Teléfono/WhatsApp del restaurante: no viene en ningún endpoint de
//   /orders, se pide aparte con RestaurantService.getPublicDetail().
//
// PENDIENTE (pedirle a Belén, no es urgente):
// - La tabla "pedidos" ya tiene columna "codigo_unico" (autogenerada en
//   la base), pero ningún endpoint de OrderService (back) la devuelve
//   todavía -- ni create(), ni findOne()/serializeOrder(), ni
//   getHistory()/serializeListOrder(). Acá ya está todo listo para
//   cuando la agregue: OrderDetail.codigoUnico es opcional y
//   buildFullOrder() ya lo lee de la respuesta si existe. Hasta que
//   eso pase, codigoUnico queda en null y pedido-confirmar.tsx usa un
//   fallback (ver ese archivo).
// ==========================================================================

export type OrderItemType = "plato" | "menu_dia" | "promocion";

export type OrderStatus =
  | "pendiente"
  | "aceptado"
  | "preparando"
  | "listo"
  | "entregado"
  | "rechazado"
  | "cancelado";

export type DeliveryMethod = "delivery" | "retiro_presencial";

// Enum metodo_entrega de Prisma tal cual lo espera/devuelve el back.
export type BackendDeliveryMethod = "DELIVERY" | "RETIRO_EN_LOCAL";

const DELIVERY_TO_BACKEND: Record<DeliveryMethod, BackendDeliveryMethod> = {
  delivery: "DELIVERY",
  retiro_presencial: "RETIRO_EN_LOCAL",
};

const DELIVERY_FROM_BACKEND: Record<BackendDeliveryMethod, DeliveryMethod> = {
  DELIVERY: "delivery",
  RETIRO_EN_LOCAL: "retiro_presencial",
};

export interface OrderProduct {
  id: string;
  nombre: string;
  imagen: string | null;
  precio: number;
}

export interface CreateOrderInput {
  dishId?: string;
  menuId?: string;
  promotionId?: string;
  observaciones?: string;
  medioEntrega: DeliveryMethod;
}

// Objeto completo que arma buildFullOrder(), usado por
// pedido-confirmar.tsx. Combina GET /orders/:id + GET /restaurants/:id +
// GET /orders/:id/whatsapp-summary en un solo shape para la UI.
export interface Order {
  id: string;
  // null hasta que el back devuelva codigo_unico (ver nota arriba).
  codigoUnico: string | null;
  usuario: { id: string; nombre: string; foto: string | null };
  restaurante: { id: string; nombre: string; whatsapp: string | null };
  pedido: {
    tipo: OrderItemType;
    estado: OrderStatus;
    total: number;
    observaciones: string | null;
    medioEntrega: DeliveryMethod;
    fecha: string;
  };
  producto: OrderProduct;
  mensajeWhatsapp: string | null;
}

// ==========================================================================
// Detalle real de un pedido -- GET /orders/:id (comensal, findOne() en el
// backend). Shape tal cual OrderService.serializeOrder() en el backend.
//
// OJO diferencias con "Order" de arriba (que es el objeto ya combinado
// que arma el front en buildFullOrder, usado por el flujo
// pedido-producto -> pedido-entrega -> pedido-confirmar):
// - metodoEntrega viene en mayúsculas ("DELIVERY" / "RETIRO_EN_LOCAL",
//   enum metodo_entrega de Prisma), no "delivery" / "retiro_presencial".
// - No trae el teléfono/WhatsApp del restaurante (solo id/nombre/
//   portada); para contactarlo hay que pedir aparte
//   RestaurantService.getPublicDetail(restauranteId) y usar
//   telefonos[0], igual que en restaurante-detalle.tsx.
// - codigoUnico es opcional porque el back todavía no lo devuelve (ver
//   nota arriba); queda listo para cuando lo agregue.
// - No incluye "historial" acá tampoco (eso solo se arma para el lado
//   restaurante, vía GET /orders/restaurant/:id).
// ==========================================================================

export interface OrderDetail {
  id: string;
  codigoUnico?: string | null;
  usuario: { id: string; nombre: string; foto: string | null };
  restaurante: { id: string; nombre: string; portada: string | null };
  pedido: {
    tipo: OrderItemType;
    estado: OrderStatus;
    total: number;
    observaciones: string | null;
    metodoEntrega: BackendDeliveryMethod;
    fecha: string;
  };
  producto: OrderProduct;
}

export interface WhatsAppSummary {
  mensajeWhatsapp: string;
}

// ==========================================================================
// Historial del comensal -- GET /orders/history. A diferencia de
// OrderDetail (GET /orders/:id), este endpoint devuelve un shape PLANO
// (mismo que serializeListOrder() del lado restaurante): nombre/imagen/
// estado/total sueltos en el objeto, no anidados en "producto"/"pedido".
// codigo_unico llega en snake_case tal cual la columna de la base (api.ts
// no transforma keys).
// ==========================================================================

export interface OrderHistoryItem {
  id: string;
  codigo_unico: string | null;
  usuario: { id: string; nombre: string; foto: string | null };
  restaurante: { id: string; nombre: string };
  tipo: OrderItemType;
  nombre: string | null;
  imagen: string | null;
  estado: OrderStatus;
  metodoEntrega: BackendDeliveryMethod;
  total: number;
  fecha: string;
}

// ==========================================================================
// Lado restaurante -- "Mi Local" (gestión de pedidos). Shape tal cual
// serializeListOrder() / serializeOrder() en el backend cuando se llaman
// desde las rutas /orders/restaurant*.
// ==========================================================================

export interface RestaurantOrderListItem {
  id: string;
  usuario: { id: string; nombre: string; foto: string | null };
  restaurante: { id: string; nombre: string };
  tipo: OrderItemType;
  nombre: string | null;
  imagen: string | null;
  estado: OrderStatus;
  metodoEntrega: BackendDeliveryMethod;
  total: number;
  fecha: string;
}

export interface RestaurantOrderDetail {
  id: string;
  usuario: { id: string; nombre: string; foto: string | null };
  restaurante: { id: string; nombre: string; portada: string | null };
  pedido: {
    tipo: OrderItemType;
    estado: OrderStatus;
    total: number;
    observaciones: string | null;
    metodoEntrega: BackendDeliveryMethod;
    fecha: string;
  };
  producto: OrderProduct;
  historial: {
    estado_anterior: OrderStatus | null;
    estado_nuevo: OrderStatus;
    created_at: string;
  }[];
}

export interface RestaurantOrdersFilters {
  estado?: OrderStatus;
  fecha?: string; // YYYY-MM-DD
}

// Transiciones válidas por estado, iguales a las que valida el back
// (OrderService.validateStatusTransition) -- se usan para no ofrecer
// un botón "avanzar" que el back va a rechazar.
export const NEXT_ORDER_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ["aceptado", "rechazado", "cancelado"],
  aceptado: ["preparando", "cancelado"],
  preparando: ["listo", "cancelado"],
  listo: ["entregado"],
  entregado: [],
  rechazado: [],
  cancelado: [],
};

class OrderService {
  // Crea el pedido real (POST /orders) y devuelve el objeto "Order"
  // completo ya armado para la pantalla de confirmación.
  async create(input: CreateOrderInput): Promise<Order> {
    const body: Record<string, unknown> = {
      metodoEntrega: DELIVERY_TO_BACKEND[input.medioEntrega],
    };
    if (input.observaciones) body.observaciones = input.observaciones;
    // El DTO del back (CreateOrderDto) espera number, acá se maneja
    // como string por los BigInt serializados -- convertir al armar
    // el body real.
    if (input.dishId != null) body.dishId = Number(input.dishId);
    if (input.menuId != null) body.menuId = Number(input.menuId);
    if (input.promotionId != null) body.promotionId = Number(input.promotionId);

    const created = await api<{ id: string }>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return this.buildFullOrder(created.id);
  }

  // Historial de pedidos del comensal autenticado -- GET /orders/history.
  // Shape plano, ver OrderHistoryItem arriba (no confundir con
  // OrderDetail, que es GET /orders/:id).
  async getHistory(): Promise<OrderHistoryItem[]> {
    return await api<OrderHistoryItem[]>("/orders/history");
  }

  // Detalle de un pedido puntual, vista comensal -- GET /orders/:id.
  async getById(id: string | number): Promise<OrderDetail> {
    return await api<OrderDetail>(`/orders/${id}`);
  }

  // Texto armado por el back para mandar por WhatsApp -- GET
  // /orders/:id/whatsapp-summary.
  async getWhatsAppSummary(id: string | number): Promise<WhatsAppSummary> {
    return await api<WhatsAppSummary>(`/orders/${id}/whatsapp-summary`);
  }

  // -- Lado restaurante ("Mi Local") ------------------------------------

  // Pedidos que le llegaron al restaurante -- GET /orders/restaurant.
  async getRestaurantOrders(filters: RestaurantOrdersFilters = {}): Promise<RestaurantOrderListItem[]> {
    const params = new URLSearchParams();
    if (filters.estado) params.append("estado", filters.estado);
    if (filters.fecha) params.append("fecha", filters.fecha);
    const qs = params.toString();
    return await api<RestaurantOrderListItem[]>(`/orders/restaurant${qs ? `?${qs}` : ""}`);
  }

  // Detalle de un pedido puntual, vista restaurante (incluye historial de
  // estados) -- GET /orders/restaurant/:id.
  async getRestaurantOrder(id: string | number): Promise<RestaurantOrderDetail> {
    return await api<RestaurantOrderDetail>(`/orders/restaurant/${id}`);
  }

  // Cambiar el estado de un pedido -- PATCH /orders/:id/status. El back
  // valida la transición (ver NEXT_ORDER_STATUSES arriba, mismo criterio).
  async updateStatus(id: string | number, estado: OrderStatus): Promise<{ id: string; estado: OrderStatus; updatedAt: string }> {
    return await api(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  }

  // Arma el "Order" completo combinando el detalle del pedido, el
  // teléfono del restaurante y el mensaje de WhatsApp. Si el teléfono o
  // el resumen de WhatsApp fallan (ej. restaurante sin teléfono cargado
  // todavía), no rompe la pantalla: quedan en null y la UI ya sabe
  // avisar ("El restaurante todavía no cargó un número de WhatsApp.")
  private async buildFullOrder(orderId: string): Promise<Order> {
    const detail = await this.getById(orderId);

    const [restaurantDetail, whatsappSummary] = await Promise.all([
      RestaurantService.getPublicDetail(detail.restaurante.id).catch(() => null),
      this.getWhatsAppSummary(orderId).catch(() => null),
    ]);

    return {
      id: detail.id,
      codigoUnico: detail.codigoUnico ?? null,
      usuario: detail.usuario,
      restaurante: {
        id: detail.restaurante.id,
        nombre: detail.restaurante.nombre,
        whatsapp: restaurantDetail?.telefonos?.[0]?.telefono ?? null,
      },
      pedido: {
        tipo: detail.pedido.tipo,
        estado: detail.pedido.estado,
        total: Number(detail.pedido.total),
        observaciones: detail.pedido.observaciones,
        medioEntrega: DELIVERY_FROM_BACKEND[detail.pedido.metodoEntrega],
        fecha: detail.pedido.fecha,
      },
      producto: {
        ...detail.producto,
        precio: Number(detail.producto.precio),
      },
      mensajeWhatsapp: whatsappSummary?.mensajeWhatsapp ?? null,
    };
  }
}

export default new OrderService();