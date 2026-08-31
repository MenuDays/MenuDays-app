// ==========================================================================
// Selección de imágenes -- helper único y a prueba de fallos.
//
// PROBLEMA que resuelve: cada pantalla llamaba a expo-image-picker a mano
// (`requestMediaLibraryPermissionsAsync` + `launchImageLibraryAsync`) SIN
// try/catch. En dispositivos antiguos / con poca RAM esas llamadas SÍ
// pueden rechazar:
//   - la app se mata en segundo plano mientras el selector nativo (otra
//     Activity) está abierto -> al volver, la promesa se pierde o rechaza;
//   - ROMs sin app de galería -> ActivityNotFoundException;
//   - imagen enorme -> OutOfMemory al decodificar el resultado;
//   - permisos de "scoped storage" que no se exponen bien.
// Una promesa rechazada dentro del onPress de un botón deja una
// "unhandled rejection" y, peor, si había un estado `uploading`/`disabled`
// seteado antes, el botón queda muerto.
//
// Estas funciones NUNCA lanzan: siempre devuelven un resultado. El caller
// solo tiene que mirar `ok`.
// ==========================================================================
import * as ImagePicker from "expo-image-picker";
import { Linking } from "react-native";
import { AppAlert } from "../app/components/common/AppAlert";

export interface PickImageResult {
  /** true solo si el usuario eligió/tomó una imagen. */
  ok: boolean;
  asset?: ImagePicker.ImagePickerAsset;
  /** Por qué no hay imagen: cancelado, permiso denegado, o error real. */
  reason?: "canceled" | "denied" | "error";
}

type PermKind = "library" | "camera";

// Pide (o consulta) el permiso sin lanzar nunca. Si el SO ya no deja
// volver a preguntar (`canAskAgain: false`), ofrece ir a Ajustes -- antes
// esto dejaba al usuario sin ninguna forma de arreglarlo y el botón
// "parecía roto".
async function ensurePermission(kind: PermKind): Promise<boolean> {
  try {
    const get =
      kind === "camera"
        ? ImagePicker.getCameraPermissionsAsync
        : ImagePicker.getMediaLibraryPermissionsAsync;
    const request =
      kind === "camera"
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;

    let current = await get();
    if (!current.granted && current.canAskAgain) {
      current = await request();
    }

    if (current.granted) return true;

    const what = kind === "camera" ? "la cámara" : "tus fotos";
    if (current.canAskAgain) {
      AppAlert.alert("Permiso necesario", `Necesitamos acceso a ${what} para continuar.`);
    } else {
      AppAlert.alert(
        "Permiso necesario",
        `Habilitá el acceso a ${what} desde Ajustes para continuar.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Abrir Ajustes", onPress: () => Linking.openSettings().catch(() => {}) },
        ]
      );
    }
    return false;
  } catch (e) {
    if (__DEV__) console.warn(`[imagePicker] permiso (${kind}):`, e);
    // Algunos dispositivos no exponen bien el estado del permiso. En vez
    // de bloquear, dejamos que el selector del sistema pida lo que
    // necesite: si de verdad no hay permiso, devuelve "cancelado".
    return true;
  }
}

const DEFAULT_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.8,
};

/** Abre la galería. Nunca lanza. */
export async function pickImageFromLibrary(
  options: ImagePicker.ImagePickerOptions = {}
): Promise<PickImageResult> {
  if (!(await ensurePermission("library"))) return { ok: false, reason: "denied" };

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      ...DEFAULT_OPTIONS,
      ...options,
    });
    if (result.canceled || !result.assets?.[0]) return { ok: false, reason: "canceled" };
    return { ok: true, asset: result.assets[0] };
  } catch (e) {
    if (__DEV__) console.warn("[imagePicker] launchImageLibraryAsync:", e);
    AppAlert.alert(
      "No se pudo abrir la galería",
      "Volvé a intentarlo. Si el problema continúa, revisá los permisos de la app en Ajustes."
    );
    return { ok: false, reason: "error" };
  }
}

/** Abre la cámara. Nunca lanza. */
export async function pickImageFromCamera(
  options: ImagePicker.ImagePickerOptions = {}
): Promise<PickImageResult> {
  if (!(await ensurePermission("camera"))) return { ok: false, reason: "denied" };

  try {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      ...options,
    });
    if (result.canceled || !result.assets?.[0]) return { ok: false, reason: "canceled" };
    return { ok: true, asset: result.assets[0] };
  } catch (e) {
    if (__DEV__) console.warn("[imagePicker] launchCameraAsync:", e);
    AppAlert.alert(
      "No se pudo abrir la cámara",
      "Volvé a intentarlo. Si el problema continúa, revisá los permisos de la app en Ajustes."
    );
    return { ok: false, reason: "error" };
  }
}
