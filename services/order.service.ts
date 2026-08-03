import { api } from "./api";

// ==========================================================================
// 1) El modelo "pedidos" ya tiene una columna "mensaje_whatsapp" pensada
//    para esto, pero OrderService.create() nunca la completa. Idealmente
//    el back arma y guarda ahí el texto final (con código de pedido,
//    producto, medio de entrega, etc.) y el front solo lo muestra/copia.
// 2) CreateOrderDto usa dishId/menuId/promotionId como number, pero acá
//    (igual que en DishService) los ids se manejan como string porque el
//    back serializa los BigInt de Prisma como string. Ojo con eso al
//    armar el body real.
// 4) El teléfono de WhatsApp del restaurante hay que traerlo del back
//    (restaurante_telefonos / telefono_contacto) — acá se mockea.
//
// Cuando esto esté resuelto del lado del back, reemplazar mockCreateOrder
// por el fetch real (dejo la llamada comentada abajo, lista para
// descomentar).
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
  // TODO(back): no existe todavía en el CreateOrderDto, ver nota arriba.
  medioEntrega: DeliveryMethod;
}

export interface Order {
  id: string;
  codigoUnico: string;
  usuario: { id: string; nombre: string; foto: string | null };
  restaurante: {
    id: string;
    nombre: string;
    // TODO(back): traer del back (restaurante_telefonos tipo "whatsapp",
    // o telefono_contacto). Se mockea acá mientras tanto.
    whatsapp: string | null;
  };
  pedido: {
    tipo: OrderItemType;
    estado: OrderStatus;
    total: number;
    observaciones: string | null;
    fecha: string;
    // TODO(back): idem medioEntrega arriba.
    medioEntrega: DeliveryMethod;
  };
  producto: OrderProduct;
  // TODO(back): hoy siempre viene null porque el service no la completa.
  mensajeWhatsapp: string | null;
}

// ==========================================================================
// Detalle real de un pedido -- GET /orders/:id (comensal, findOne() en el
// backend). Shape tal cual OrderService.serializeOrder() en el backend.
//
// OJO diferencias con el "Order" de arriba (que es 100% mock, usado por
// el flujo pedido-producto -> pedido-entrega -> pedido-confirmar):
// - metodoEntrega viene en mayúsculas ("DELIVERY" / "RETIRO_EN_LOCAL",
//   enum metodo_entrega de Prisma), no "delivery" / "retiro_presencial".
// - No trae codigoUnico ni mensajeWhatsapp: la columna codigo_unico
//   existe en la tabla "pedidos" pero ningún endpoint la devuelve
//   todavía (ni create, ni findOne, ni getHistory) -- avisar al back.
// - No trae el teléfono/WhatsApp del restaurante (solo id/nombre/
//   portada); para contactarlo hay que pedir aparte
//   RestaurantService.getPublicDetail(restauranteId) y usar
//   telefonos[0], igual que en restaurante-detalle.tsx.
// - No incluye "historial" (eso solo se arma para el lado restaurante,
//   vía GET /orders/restaurant/:id).
// ==========================================================================

export type BackendDeliveryMethod = "DELIVERY" | "RETIRO_EN_LOCAL";

export interface OrderDetail {
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
}

export interface WhatsAppSummary {
  mensajeWhatsapp: string;
}

class OrderService {
  async create(input: CreateOrderInput): Promise<Order> {
    // Llamada real, para cuando el back soporte medioEntrega y arme
    // mensaje_whatsapp (dejar esto y sacar el mock de abajo):
    //
    // return api<Order>("/orders", {
    //   method: "POST",
    //   body: JSON.stringify(input),
    // });

    return mockCreateOrder(input);
  }

  // Historial de pedidos del comensal autenticado -- GET /orders/history.
  // Devuelve la misma forma que OrderDetail pero sin el detalle completo
  // (ver serializeListOrder() en el backend); alcanza para listar.
  async getHistory(): Promise<OrderDetail[]> {
    return await api<OrderDetail[]>("/orders/history");
  }

  // Detalle de un pedido puntual, vista comensal -- GET /orders/:id.
  async getById(id: string | number): Promise<OrderDetail> {
    return await api<OrderDetail>(`/orders/${id}`);
  }

  // Texto armado por el back para mandar por WhatsApp -- GET
  // /orders/:id/whatsapp-summary. No incluye el teléfono del
  // restaurante, hay que conseguirlo aparte (ver nota en OrderDetail).
  async getWhatsAppSummary(id: string | number): Promise<WhatsAppSummary> {
    return await api<WhatsAppSummary>(`/orders/${id}/whatsapp-summary`);
  }
}

// -- mock --------------------------------------------------------------

function buildMockWhatsappMessage(order: Omit<Order, "mensajeWhatsapp">): string {
  const medio =
    order.pedido.medioEntrega === "delivery" ? "Delivery" : "Retiro en el local";
  return (
    `Hola! Quiero confirmar mi pedido *#${order.codigoUnico}* de ${order.restaurante.nombre}.\n` +
    `Producto: ${order.producto.nombre}\n` +
    `Medio de entrega: ${medio}\n` +
    `Total: $${order.pedido.total.toFixed(2)}` +
    (order.pedido.observaciones ? `\nObservaciones: ${order.pedido.observaciones}` : "")
  );
}

function mockCreateOrder(input: CreateOrderInput): Promise<Order> {
  const codigoUnico = Math.random().toString(36).slice(2, 10).toUpperCase();

  const base: Omit<Order, "mensajeWhatsapp"> = {
    id: `mock-${Date.now()}`,
    codigoUnico,
    usuario: { id: "mock-user", nombre: "Vos", foto: null },
    restaurante: {
      id: "mock-restaurant",
      nombre: "El Banquito",
      whatsapp: "5493434000000",
    },
    pedido: {
      tipo: input.dishId ? "plato" : input.menuId ? "menu_dia" : "promocion",
      estado: "pendiente",
      total: 3500,
      observaciones: input.observaciones ?? null,
      fecha: new Date().toISOString(),
      medioEntrega: input.medioEntrega,
    },
    producto: {
      id: input.dishId ?? input.menuId ?? input.promotionId ?? "mock-product",
      nombre: "Hamburguesa completa",
      imagen: null,
      precio: 3500,
    },
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...base, mensajeWhatsapp: buildMockWhatsappMessage(base) });
    }, 400);
  });
}

export default new OrderService();