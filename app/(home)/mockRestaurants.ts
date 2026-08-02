// ==========================================================================
// TODO: mock compartido a propósito (a pedido, sin conexión a backend
// todavía). Cuando se conecte, reemplazar por ExploreService /
// RestaurantService pegándole a GET /explore/restaurants.
// ==========================================================================

export interface MockRestaurant {
  id: number;
  nombre: string;
  categoria: string;
  provincia: string;
  ciudad: string;
  calificacion: number;
  cantidadResenas: number;
  distanciaKm: number;
  abierto: boolean;
}

export const MOCK_RESTAURANTS: MockRestaurant[] = [
  { id: 1, nombre: "El Banquito", categoria: "Ejecutivo", provincia: "Pichincha", ciudad: "Quito", calificacion: 4.8, cantidadResenas: 132, distanciaKm: 0.8, abierto: true },
  { id: 2, nombre: "Culinary", categoria: "Parrillas", provincia: "Pichincha", ciudad: "Quito", calificacion: 4.5, cantidadResenas: 87, distanciaKm: 1.6, abierto: true },
  { id: 3, nombre: "Sabor Ecuador", categoria: "Sopas", provincia: "Pichincha", ciudad: "Sangolquí", calificacion: 4.2, cantidadResenas: 54, distanciaKm: 3.4, abierto: false },
  { id: 4, nombre: "Resto", categoria: "Pollo", provincia: "Guayas", ciudad: "Guayaquil", calificacion: 4.6, cantidadResenas: 210, distanciaKm: 5.1, abierto: true },
  { id: 5, nombre: "Mariscos del Puerto", categoria: "Mariscos", provincia: "Guayas", ciudad: "Guayaquil", calificacion: 4.9, cantidadResenas: 305, distanciaKm: 6.9, abierto: true },
  { id: 6, nombre: "La Cuchara Azuaya", categoria: "Sopas", provincia: "Azuay", ciudad: "Cuenca", calificacion: 4.3, cantidadResenas: 42, distanciaKm: 9.2, abierto: false },
  { id: 7, nombre: "Brasas del Valle", categoria: "Parrillas", provincia: "Pichincha", ciudad: "Cayambe", calificacion: 4.0, cantidadResenas: 19, distanciaKm: 12.5, abierto: true },
  { id: 8, nombre: "Pollo Real", categoria: "Pollo", provincia: "Pichincha", ciudad: "Quito", calificacion: 3.9, cantidadResenas: 61, distanciaKm: 2.1, abierto: true },
];

// ==========================================================================
// Mock de "comida" para explorar-resultados.tsx (platos / menús /
// promociones). Ligado a las mismas categorías de la grilla.
//
// OJO backend: en el schema actual, `platos` sí tiene categoria_id,
// pero `menus_del_dia` y `promociones` NO tienen relación con
// categorías todavía. Para conectar de verdad el filtro por categoría
// en esos dos tabs, hay que decidir cómo inferirlo (¿por los platos
// que incluye el menú? ¿agregar categoria_id a esas tablas?) antes de
// armar el endpoint real.
// ==========================================================================

export interface MockFoodItem {
  id: number;
  nombre: string;
  categoria: string;
  restaurante: string;
  ciudad: string;
  provincia: string;
  precio: number;
  precioOriginal?: number; // solo promociones (para mostrar tachado)
  calificacion: number;
  cantidadResenas: number;
  distanciaKm: number;
  abierto: boolean;
}

export const MOCK_PLATOS: MockFoodItem[] = [
  { id: 1, nombre: "Seco de pollo", categoria: "Pollo", restaurante: "El Banquito", ciudad: "Quito", provincia: "Pichincha", precio: 4.5, calificacion: 4.8, cantidadResenas: 132, distanciaKm: 0.8, abierto: true },
  { id: 2, nombre: "Ceviche de camarón", categoria: "Mariscos", restaurante: "Mariscos del Puerto", ciudad: "Guayaquil", provincia: "Guayas", precio: 8.0, calificacion: 4.9, cantidadResenas: 305, distanciaKm: 6.9, abierto: true },
  { id: 3, nombre: "Parrillada mixta", categoria: "Parrillas", restaurante: "Culinary", ciudad: "Quito", provincia: "Pichincha", precio: 12.5, calificacion: 4.5, cantidadResenas: 87, distanciaKm: 1.6, abierto: true },
  { id: 4, nombre: "Locro de papa", categoria: "Sopas", restaurante: "Sabor Ecuador", ciudad: "Sangolquí", provincia: "Pichincha", precio: 3.5, calificacion: 4.2, cantidadResenas: 54, distanciaKm: 3.4, abierto: false },
  { id: 5, nombre: "Almuerzo ejecutivo", categoria: "Ejecutivo", restaurante: "El Banquito", ciudad: "Quito", provincia: "Pichincha", precio: 4.0, calificacion: 4.7, cantidadResenas: 98, distanciaKm: 0.9, abierto: true },
  { id: 6, nombre: "Hamburguesa clásica", categoria: "Hamburguesas", restaurante: "Resto", ciudad: "Guayaquil", provincia: "Guayas", precio: 5.5, calificacion: 4.4, cantidadResenas: 61, distanciaKm: 5.3, abierto: true },
  { id: 7, nombre: "Pizza margarita", categoria: "Pizzas", restaurante: "Culinary", ciudad: "Quito", provincia: "Pichincha", precio: 9.0, calificacion: 4.3, cantidadResenas: 40, distanciaKm: 1.8, abierto: true },
  { id: 8, nombre: "Bowl vegano", categoria: "Vegana", restaurante: "Pollo Real", ciudad: "Quito", provincia: "Pichincha", precio: 6.5, calificacion: 4.1, cantidadResenas: 22, distanciaKm: 2.4, abierto: true },
];

export const MOCK_MENUS: MockFoodItem[] = [
  { id: 101, nombre: "Menú del día: sopa + seco + jugo", categoria: "Ejecutivo", restaurante: "El Banquito", ciudad: "Quito", provincia: "Pichincha", precio: 4.5, calificacion: 4.8, cantidadResenas: 132, distanciaKm: 0.8, abierto: true },
  { id: 102, nombre: "Menú marino del día", categoria: "Mariscos", restaurante: "Mariscos del Puerto", ciudad: "Guayaquil", provincia: "Guayas", precio: 9.0, calificacion: 4.9, cantidadResenas: 305, distanciaKm: 6.9, abierto: true },
  { id: 103, nombre: "Menú parrillero", categoria: "Parrillas", restaurante: "Culinary", ciudad: "Quito", provincia: "Pichincha", precio: 13.0, calificacion: 4.5, cantidadResenas: 87, distanciaKm: 1.6, abierto: true },
  { id: 104, nombre: "Menú criollo", categoria: "Sopas", restaurante: "Sabor Ecuador", ciudad: "Sangolquí", provincia: "Pichincha", precio: 4.0, calificacion: 4.2, cantidadResenas: 54, distanciaKm: 3.4, abierto: false },
];

export const MOCK_PROMOCIONES: MockFoodItem[] = [
  { id: 201, nombre: "2x1 en almuerzo ejecutivo", categoria: "Ejecutivo", restaurante: "El Banquito", ciudad: "Quito", provincia: "Pichincha", precio: 4.0, precioOriginal: 8.0, calificacion: 4.8, cantidadResenas: 132, distanciaKm: 0.8, abierto: true },
  { id: 202, nombre: "20% off en ceviches", categoria: "Mariscos", restaurante: "Mariscos del Puerto", ciudad: "Guayaquil", provincia: "Guayas", precio: 6.4, precioOriginal: 8.0, calificacion: 4.9, cantidadResenas: 305, distanciaKm: 6.9, abierto: true },
  { id: 203, nombre: "Combo parrilla + bebida", categoria: "Parrillas", restaurante: "Culinary", ciudad: "Quito", provincia: "Pichincha", precio: 10.5, precioOriginal: 14.0, calificacion: 4.5, cantidadResenas: 87, distanciaKm: 1.6, abierto: true },
];



export const CATEGORIES = ["Todas", "Ejecutivo", "Mariscos", "Parrillas", "Sopas", "Pollo"];

export const PROVINCES = ["Todas", "Pichincha", "Guayas", "Azuay"];

export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  Todas: ["Todas"],
  Pichincha: ["Todas", "Quito", "Cayambe", "Sangolquí"],
  Guayas: ["Todas", "Guayaquil", "Durán", "Samborondón"],
  Azuay: ["Todas", "Cuenca", "Gualaceo"],
};