import { ImageSourcePropType } from "react-native";

// ==========================================================================
// Íconos de categoría empaquetados en el propio front (assets/images/categorias),
// en vez de pedirlos por red a item.iconos.url (Cloudinary) cada vez que se
// abre Inicio/Explorar. Son los mismos PNG que ya existían en el back
// (menu-days-api/src/assets/categorias), copiados acá 1:1 por nombre de
// archivo == nombre de categoría en la base.
//
// require() necesita rutas ESTÁTICAS (Metro no puede resolver un
// template string dinámico), por eso el mapeo está a mano en vez de
// armarse con `require(`../assets/images/categorias/${nombre}.png`)`.
//
// Si el back agrega una categoría nueva sin ícono local todavía, getCategoryIcon
// devuelve null y quien la use cae a su fallback de siempre (item.iconos?.url
// remoto, o el ícono genérico de Ionicons) -- no rompe nada.
// ==========================================================================

export const CATEGORY_ICONS: Record<string, ImageSourcePropType> = {
  "Bares": require("../assets/images/categorias/Bares.png"),
  "Bebidas": require("../assets/images/categorias/Bebidas.png"),
  "Bolones": require("../assets/images/categorias/Bolones.png"),
  "Cafetería": require("../assets/images/categorias/Cafetería.png"),
  "Cevicherías": require("../assets/images/categorias/Cevicherías.png"),
  "Comida China": require("../assets/images/categorias/Comida China.png"),
  "Comida Rápida": require("../assets/images/categorias/Comida Rápida.png"),
  "Comida Típica": require("../assets/images/categorias/Comida Típica.png"),
  "Desayunos": require("../assets/images/categorias/Desayunos.png"),
  "Ejecutivo": require("../assets/images/categorias/Ejecutivo.png"),
  "Empanadas": require("../assets/images/categorias/Empanadas.png"),
  "Ensaladas": require("../assets/images/categorias/Ensaladas.png"),
  "Hamburguesas": require("../assets/images/categorias/Hamburguesas.png"),
  "Heladeria": require("../assets/images/categorias/Heladeria.png"),
  "Mariscos": require("../assets/images/categorias/Mariscos.png"),
  "Mexicana": require("../assets/images/categorias/Mexicana.png"),
  "Panadería": require("../assets/images/categorias/Panadería.png"),
  "Parrillas": require("../assets/images/categorias/Parrillas.png"),
  "Pastas": require("../assets/images/categorias/Pastas.png"),
  "Pizzas": require("../assets/images/categorias/Pizzas.png"),
  "Pollo": require("../assets/images/categorias/Pollo.png"),
  "Postres saludables": require("../assets/images/categorias/Postres saludables.png"),
  "Postres": require("../assets/images/categorias/Postres.png"),
  "Sandwiches": require("../assets/images/categorias/Sandwiches.png"),
  "Sopas": require("../assets/images/categorias/Sopas.png"),
  "Sushi": require("../assets/images/categorias/Sushi.png"),
  "Vegana": require("../assets/images/categorias/Vegana.png"),
};

export function getCategoryIcon(nombre: string): ImageSourcePropType | null {
  return CATEGORY_ICONS[nombre] ?? null;
}
