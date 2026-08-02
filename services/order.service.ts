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