// ==========================================================================
// Cuando se conecte, esta pantalla debería recibir el id + tipo del
// producto por params (ej: /pedido-producto?id=3&tipo=plato) y buscarlo
// con DishService.getById / MenuService.getById / PromotionService.getById
// según corresponda, en vez de este mock fijo.
// ==========================================================================

export interface MockPedidoProducto {
  id: string;
  tipo: "plato" | "menu_dia" | "promocion";
  nombre: string;
  imagen: string;
  precio: number;
  restaurante: string;
}

export const MOCK_PEDIDO_PRODUCTO: MockPedidoProducto = {
  id: "3",
  tipo: "plato",
  nombre: "Hamburguesa completa",
  imagen:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  precio: 3500,
  restaurante: "El Banquito",
};
