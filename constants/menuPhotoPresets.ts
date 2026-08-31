import { ImageSourcePropType } from "react-native";

// ==========================================================================
// Fotos de EJEMPLO para los menús del restaurante (assets/menu-presets/).
// Sirven para que una card de menú no quede vacía si el restaurante no
// sube su propia foto: puede elegir una de estas. Están agrupadas por
// categoría de cocina. require() necesita rutas estáticas, por eso el
// mapeo está a mano (mismo criterio que constants/categoryIcons.ts).
// ==========================================================================

export interface MenuPhotoPreset {
  /** id estable, ej. "hamburguesa-1" */
  id: string;
  /** etiqueta de categoría para agrupar en la UI */
  category: string;
  source: ImageSourcePropType;
}

export const MENU_PHOTO_PRESETS: MenuPhotoPreset[] = [
  { id: "almuerzos-1", category: "Almuerzos", source: require("../assets/menu-presets/almuerzos/1.jpg") },
  { id: "almuerzos-2", category: "Almuerzos", source: require("../assets/menu-presets/almuerzos/2.jpg") },
  { id: "bares-1", category: "Bares", source: require("../assets/menu-presets/bares/1.jpg") },
  { id: "bares-2", category: "Bares", source: require("../assets/menu-presets/bares/2.jpg") },
  { id: "bares-3", category: "Bares", source: require("../assets/menu-presets/bares/3.jpg") },
  { id: "bebidas-1", category: "Bebidas", source: require("../assets/menu-presets/bebidas/1.jpg") },
  { id: "bebidas-2", category: "Bebidas", source: require("../assets/menu-presets/bebidas/2.jpg") },
  { id: "bebidas-3", category: "Bebidas", source: require("../assets/menu-presets/bebidas/3.jpg") },
  { id: "bebidas-4", category: "Bebidas", source: require("../assets/menu-presets/bebidas/4.jpg") },
  { id: "bolones-1", category: "Bolones", source: require("../assets/menu-presets/bolones/1.jpg") },
  { id: "bolones-2", category: "Bolones", source: require("../assets/menu-presets/bolones/2.jpg") },
  { id: "cafeterias-1", category: "Cafetería", source: require("../assets/menu-presets/cafeterias/1.jpg") },
  { id: "cafeterias-2", category: "Cafetería", source: require("../assets/menu-presets/cafeterias/2.jpg") },
  { id: "cafeterias-3", category: "Cafetería", source: require("../assets/menu-presets/cafeterias/3.jpg") },
  { id: "cenas-1", category: "Cenas", source: require("../assets/menu-presets/cenas/1.jpg") },
  { id: "cenas-2", category: "Cenas", source: require("../assets/menu-presets/cenas/2.jpg") },
  { id: "cenas-3", category: "Cenas", source: require("../assets/menu-presets/cenas/3.jpg") },
  { id: "cevicherias-1", category: "Cevicherías", source: require("../assets/menu-presets/cevicherias/1.jpg") },
  { id: "cevicherias-2", category: "Cevicherías", source: require("../assets/menu-presets/cevicherias/2.jpg") },
  { id: "comida-china-1", category: "Comida China", source: require("../assets/menu-presets/comida-china/1.jpg") },
  { id: "comida-china-2", category: "Comida China", source: require("../assets/menu-presets/comida-china/2.jpg") },
  { id: "comida-tipica-1", category: "Comida Típica", source: require("../assets/menu-presets/comida-tipica/1.jpg") },
  { id: "comida-tipica-2", category: "Comida Típica", source: require("../assets/menu-presets/comida-tipica/2.jpg") },
  { id: "desayunos-1", category: "Desayunos", source: require("../assets/menu-presets/desayunos/1.jpg") },
  { id: "desayunos-2", category: "Desayunos", source: require("../assets/menu-presets/desayunos/2.jpg") },
  { id: "desayunos-3", category: "Desayunos", source: require("../assets/menu-presets/desayunos/3.jpg") },
  { id: "desayunos-4", category: "Desayunos", source: require("../assets/menu-presets/desayunos/4.jpg") },
  { id: "ejecutivo-1", category: "Ejecutivo", source: require("../assets/menu-presets/ejecutivo/1.jpg") },
  { id: "ejecutivo-2", category: "Ejecutivo", source: require("../assets/menu-presets/ejecutivo/2.jpg") },
  { id: "empanadas-1", category: "Empanadas", source: require("../assets/menu-presets/empanadas/1.jpg") },
  { id: "empanadas-2", category: "Empanadas", source: require("../assets/menu-presets/empanadas/2.jpg") },
  { id: "empanadas-3", category: "Empanadas", source: require("../assets/menu-presets/empanadas/3.jpg") },
  { id: "empanadas-4", category: "Empanadas", source: require("../assets/menu-presets/empanadas/4.jpg") },
  { id: "ensaladas-1", category: "Ensaladas", source: require("../assets/menu-presets/ensaladas/1.jpg") },
  { id: "ensaladas-2", category: "Ensaladas", source: require("../assets/menu-presets/ensaladas/2.jpg") },
  { id: "ensaladas-3", category: "Ensaladas", source: require("../assets/menu-presets/ensaladas/3.jpg") },
  { id: "ensaladas-4", category: "Ensaladas", source: require("../assets/menu-presets/ensaladas/4.jpg") },
  { id: "fruterias-1", category: "Fruterías", source: require("../assets/menu-presets/fruterias/1.jpg") },
  { id: "fruterias-2", category: "Fruterías", source: require("../assets/menu-presets/fruterias/2.jpg") },
  { id: "fruterias-3", category: "Fruterías", source: require("../assets/menu-presets/fruterias/3.jpg") },
  { id: "hamburguesa-1", category: "Hamburguesas", source: require("../assets/menu-presets/hamburguesa/1.jpg") },
  { id: "hamburguesa-2", category: "Hamburguesas", source: require("../assets/menu-presets/hamburguesa/2.jpg") },
  { id: "hamburguesa-3", category: "Hamburguesas", source: require("../assets/menu-presets/hamburguesa/3.jpg") },
  { id: "heladerias-1", category: "Heladería", source: require("../assets/menu-presets/heladerias/1.jpg") },
  { id: "heladerias-2", category: "Heladería", source: require("../assets/menu-presets/heladerias/2.jpg") },
  { id: "heladerias-3", category: "Heladería", source: require("../assets/menu-presets/heladerias/3.jpg") },
  { id: "mariscos-1", category: "Mariscos", source: require("../assets/menu-presets/mariscos/1.jpg") },
  { id: "mariscos-2", category: "Mariscos", source: require("../assets/menu-presets/mariscos/2.jpg") },
  { id: "meriendas-1", category: "Meriendas", source: require("../assets/menu-presets/meriendas/1.jpg") },
  { id: "meriendas-2", category: "Meriendas", source: require("../assets/menu-presets/meriendas/2.jpg") },
  { id: "meriendas-3", category: "Meriendas", source: require("../assets/menu-presets/meriendas/3.jpg") },
  { id: "panaderias-1", category: "Panadería", source: require("../assets/menu-presets/panaderias/1.jpg") },
  { id: "panaderias-2", category: "Panadería", source: require("../assets/menu-presets/panaderias/2.jpg") },
  { id: "panaderias-3", category: "Panadería", source: require("../assets/menu-presets/panaderias/3.jpg") },
  { id: "panaderias-4", category: "Panadería", source: require("../assets/menu-presets/panaderias/4.jpg") },
  { id: "parrillas-1", category: "Parrillas", source: require("../assets/menu-presets/parrillas/1.jpg") },
  { id: "parrillas-2", category: "Parrillas", source: require("../assets/menu-presets/parrillas/2.jpg") },
  { id: "parrillas-3", category: "Parrillas", source: require("../assets/menu-presets/parrillas/3.jpg") },
  { id: "pastas-1", category: "Pastas", source: require("../assets/menu-presets/pastas/1.jpg") },
  { id: "pastas-2", category: "Pastas", source: require("../assets/menu-presets/pastas/2.jpg") },
  { id: "pastas-3", category: "Pastas", source: require("../assets/menu-presets/pastas/3.jpg") },
  { id: "pastas-4", category: "Pastas", source: require("../assets/menu-presets/pastas/4.jpg") },
  { id: "pizzerias-1", category: "Pizzas", source: require("../assets/menu-presets/pizzerias/1.jpg") },
  { id: "pizzerias-2", category: "Pizzas", source: require("../assets/menu-presets/pizzerias/2.jpg") },
  { id: "pizzerias-3", category: "Pizzas", source: require("../assets/menu-presets/pizzerias/3.jpg") },
  { id: "pollo-1", category: "Pollo", source: require("../assets/menu-presets/pollo/1.jpg") },
  { id: "pollo-2", category: "Pollo", source: require("../assets/menu-presets/pollo/2.jpg") },
  { id: "pollo-3", category: "Pollo", source: require("../assets/menu-presets/pollo/3.jpg") },
  { id: "postres-1", category: "Postres", source: require("../assets/menu-presets/postres/1.jpg") },
  { id: "postres-2", category: "Postres", source: require("../assets/menu-presets/postres/2.jpg") },
  { id: "postres-3", category: "Postres", source: require("../assets/menu-presets/postres/3.jpg") },
  { id: "postres-4", category: "Postres", source: require("../assets/menu-presets/postres/4.jpg") },
  { id: "postres-5", category: "Postres", source: require("../assets/menu-presets/postres/5.jpg") },
  { id: "postres-6", category: "Postres", source: require("../assets/menu-presets/postres/6.jpg") },
  { id: "sopas-1", category: "Sopas", source: require("../assets/menu-presets/sopas/1.jpg") },
  { id: "sopas-2", category: "Sopas", source: require("../assets/menu-presets/sopas/2.jpg") },
  { id: "sopas-3", category: "Sopas", source: require("../assets/menu-presets/sopas/3.jpg") },
  { id: "sopas-4", category: "Sopas", source: require("../assets/menu-presets/sopas/4.jpg") },
  { id: "sushi-1", category: "Sushi", source: require("../assets/menu-presets/sushi/1.jpg") },
  { id: "sushi-2", category: "Sushi", source: require("../assets/menu-presets/sushi/2.jpg") },
  { id: "sushi-3", category: "Sushi", source: require("../assets/menu-presets/sushi/3.jpg") },
  { id: "sushi-4", category: "Sushi", source: require("../assets/menu-presets/sushi/4.jpg") },
  { id: "sushi-5", category: "Sushi", source: require("../assets/menu-presets/sushi/5.jpg") },
  { id: "vegana-1", category: "Vegana", source: require("../assets/menu-presets/vegana/1.jpg") },
  { id: "vegana-2", category: "Vegana", source: require("../assets/menu-presets/vegana/2.jpg") },
  { id: "vegana-3", category: "Vegana", source: require("../assets/menu-presets/vegana/3.jpg") },
];

// 5 destacadas -- se muestran directo bajo el selector de foto, sin abrir
// "Ver más". Elegidas por variedad y que se ven apetitosas.
export const FEATURED_MENU_PHOTO_PRESET_IDS = [
  "hamburguesa-1",
  "sushi-1",
  "pizzerias-1",
  "postres-1",
  "ensaladas-1",
];

export function findMenuPhotoPreset(id: string): MenuPhotoPreset | undefined {
  return MENU_PHOTO_PRESETS.find((p) => p.id === id);
}

export function getFeaturedMenuPhotoPresets(): MenuPhotoPreset[] {
  return FEATURED_MENU_PHOTO_PRESET_IDS
    .map(findMenuPhotoPreset)
    .filter((p): p is MenuPhotoPreset => p !== undefined);
}

export interface MenuPhotoPresetGroup {
  category: string;
  items: MenuPhotoPreset[];
}

// Todas las fotos agrupadas por categoría (para el modal "Ver más").
// Si se pasa `priorityCategory`, ese grupo va primero.
export function getMenuPhotoPresetGroups(priorityCategory?: string | null): MenuPhotoPresetGroup[] {
  const byCat = new Map<string, MenuPhotoPreset[]>();
  for (const preset of MENU_PHOTO_PRESETS) {
    const list = byCat.get(preset.category) ?? [];
    list.push(preset);
    byCat.set(preset.category, list);
  }
  const groups: MenuPhotoPresetGroup[] = Array.from(byCat.entries()).map(([category, items]) => ({ category, items }));
  if (priorityCategory) {
    groups.sort((a, b) => {
      if (a.category === priorityCategory) return -1;
      if (b.category === priorityCategory) return 1;
      return a.category.localeCompare(b.category);
    });
  }
  return groups;
}
