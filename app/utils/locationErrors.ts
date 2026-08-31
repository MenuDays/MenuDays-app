import { AppAlert } from "../components/common/AppAlert";

// Catálogo centralizado de mensajes de error relacionados a ubicación,
// para que TODA la app (selección de provincia/ciudad, mapa, permisos,
// GPS, carga de datos con lat/lng) hable con el mismo tono -- claro,
// corto, en español -- en vez de que cada pantalla invente su propio
// "Error" o "Something went wrong" genérico.

export type LocationErrorKind =
  | "missingProvince"
  | "missingCity"
  | "incompleteManualAddress"
  | "locationNotFound"
  | "networkError"
  | "permissionDenied"
  | "locationUnavailable"
  | "locationServicesDisabled"
  | "genericError";

interface LocationErrorContent {
  title: string;
  message: string;
  confirmText: string;
}

const CONTENT: Record<LocationErrorKind, LocationErrorContent> = {
  missingProvince: {
    title: "Selecciona una provincia",
    message: "Para continuar, elige una provincia de la lista.",
    confirmText: "Entendido",
  },
  missingCity: {
    title: "Selecciona una ciudad",
    message:
      "Para continuar, elige una ciudad o cantón dentro de la provincia seleccionada.",
    confirmText: "Entendido",
  },
  incompleteManualAddress: {
    title: "Ubicación incompleta",
    message:
      "Agrega más detalles a la dirección (calle, número o referencia) para poder ubicarte.",
    confirmText: "Entendido",
  },
  locationNotFound: {
    title: "No encontramos esa ubicación",
    message: "Revisa la dirección ingresada o prueba con una ubicación más específica.",
    confirmText: "Revisar ubicación",
  },
  networkError: {
    title: "Sin conexión",
    message:
      "No pudimos consultar tu ubicación. Revisa tu conexión a internet e intenta nuevamente.",
    confirmText: "Reintentar",
  },
  permissionDenied: {
    title: "Necesitamos tu ubicación",
    message:
      "Activa el permiso de ubicación para MenuDays desde los ajustes de tu dispositivo, o elígela manualmente en el mapa.",
    confirmText: "Entendido",
  },
  locationUnavailable: {
    title: "No pudimos obtener tu ubicación",
    message:
      "Tu dispositivo no pudo determinar tu posición actual. Prueba de nuevo o elígela manualmente en el mapa.",
    confirmText: "Reintentar",
  },
  locationServicesDisabled: {
    title: "Ubicación desactivada",
    message: "Activa el acceso a tu ubicación desde los ajustes del dispositivo para continuar.",
    confirmText: "Entendido",
  },
  // Único caso genérico del catálogo: reservado para errores internos
  // inesperados que no se pueden identificar mejor (ver item 13 del
  // pedido -- ahí sí está permitido un mensaje genérico).
  genericError: {
    title: "No pudimos completar la acción",
    message: "Ocurrió un problema inesperado. Intenta de nuevo en unos minutos.",
    confirmText: "Entendido",
  },
};

export function showLocationError(kind: LocationErrorKind, onPress?: () => void) {
  const content = CONTENT[kind];
  AppAlert.alert(content.title, content.message, [
    { text: content.confirmText, onPress },
  ]);
}

// services/api.ts usa `fetch` (no axios): un error de conectividad real
// (sin internet, DNS, servidor inalcanzable) hace que fetch RECHACE la
// promesa con un TypeError -- en React Native, con el mensaje
// "Network request failed". Un error de servidor (4xx/5xx) en cambio
// llega como un `Error` normal con el mensaje que mandó el backend, así
// que esto los distingue sin tocar `api()`.
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error")
  );
}
