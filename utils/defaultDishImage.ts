import { Asset } from "expo-asset";
import { getCategoryIcon } from "../constants/categoryIcons";

// Último recurso cuando la categoría elegida no tiene ícono local
// mapeado en constants/categoryIcons.ts.
const FALLBACK_ICON = require("../assets/images/categorias/Comida Típica.png");

// Los localUri resueltos no cambian entre pantallas ni se limpian solos
// -- se resuelven una sola vez por sesión y se reusan.
const resolvedUriCache = new Map<string, string>();

async function resolveLocalUri(source: number, cacheKey: string): Promise<string> {
  const cached = resolvedUriCache.get(cacheKey);
  if (cached) return cached;

  const [asset] = await Asset.loadAsync(source);
  const uri = asset.localUri ?? asset.uri;
  resolvedUriCache.set(cacheKey, uri);
  return uri;
}

// El back exige el campo `image` al crear un menú/plato/promoción
// (@IsNotEmpty en los 3 DTOs), pero desde la UI no queremos forzar al
// restaurante a tener una foto propia lista para poder guardar. Esta
// función arma un uri local real (vía expo-asset, así funciona igual en
// Expo Go, dev client y build standalone) con el ícono de la categoría
// elegida -- o uno genérico si esa categoría no tiene ícono mapeado --
// para usar como foto de relleno cuando el usuario no sube ninguna.
export async function getDefaultDishImageUri(
  categoryName?: string | null
): Promise<string> {
  const categoryIcon = categoryName ? getCategoryIcon(categoryName) : null;

  if (categoryIcon) {
    return resolveLocalUri(categoryIcon as number, categoryName!);
  }

  return resolveLocalUri(FALLBACK_ICON, "__default__");
}
