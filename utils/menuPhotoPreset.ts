import { Asset } from "expo-asset";
import { findMenuPhotoPreset } from "../constants/menuPhotoPresets";

// Los localUri resueltos no cambian durante la sesión -- se resuelven
// una sola vez por preset y se reusan (mismo criterio que
// utils/defaultDishImage.ts).
const resolvedUriCache = new Map<string, string>();

/**
 * Convierte una foto de ejemplo (bundleada con require()) en un uri local
 * REAL, apto para subir por multipart/form-data igual que una foto que el
 * restaurante hubiera elegido de su galería. Funciona en Expo Go, dev
 * client y build standalone.
 */
export async function resolveMenuPhotoPresetUri(presetId: string): Promise<string | null> {
  const cached = resolvedUriCache.get(presetId);
  if (cached) return cached;

  const preset = findMenuPhotoPreset(presetId);
  if (!preset) return null;

  const [asset] = await Asset.loadAsync(preset.source as number);
  const uri = asset.localUri ?? asset.uri;
  resolvedUriCache.set(presetId, uri);
  return uri;
}
