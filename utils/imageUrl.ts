// ==========================================================================
// Optimización de imágenes de Cloudinary desde el front, SIN tocar el
// backend ni el diseño.
//
// El back sube las fotos (menús, platos, promos, galería, logos, portadas,
// perfiles) a Cloudinary y guarda la URL "cruda" -- normalmente el archivo
// original, que puede pesar varios MB y venir a 3000-4000px de ancho.
// Mostrar eso tal cual en una card de 150px:
//   - descarga MB de más (datos móviles lentos = card en blanco un rato);
//   - Android tiene que decodificar el bitmap COMPLETO en memoria
//     (4000x3000 ≈ 48 MB de RAM por imagen) -> en un teléfono con poca
//     RAM, unas pocas imágenes así en una lista disparan un OutOfMemory y
//     la pantalla queda a medio dibujar o se traba.
//
// Cloudinary permite pedir una versión ya redimensionada/comprimida
// metiendo transformaciones en la URL, justo después de "/upload/":
//   .../upload/f_auto,q_auto,c_limit,w_600/v123/foto.jpg
//
//   f_auto  -> formato óptimo (WebP en Android) = más liviano
//   q_auto  -> calidad automática (sin pérdida perceptible)
//   c_limit -> SOLO reduce si la original es más grande; nunca la agranda
//              (no hay pérdida de nitidez para lo que se ve más chico)
//   w_<N>   -> ancho máximo en px
//
// Si la URL no es de Cloudinary (o ya trae transformaciones), se devuelve
// intacta. Es una función pura de strings: no rompe nada.
// ==========================================================================

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

// Anchos objetivo por tipo de uso. Se piden un poco más grandes que el
// tamaño en pantalla para que se vean nítidas en densidades altas (dpr 2-3)
// sin traer el original completo.
export type ImageSizePreset = "thumb" | "card" | "cover" | "full";

const PRESET_WIDTH: Record<ImageSizePreset, number> = {
  thumb: 200, // miniaturas de lista / grillas (48-100px en pantalla)
  card: 600, // cards medianas, imágenes de detalle
  cover: 1080, // portadas / hero a ancho completo
  full: 1600, // visor de imagen a pantalla completa con zoom
};

/**
 * Devuelve la URL lista para mostrar. Para imágenes de Cloudinary, inserta
 * transformaciones de tamaño/calidad. Para cualquier otra cosa (o null),
 * la devuelve sin tocar.
 */
export function optimizedImageUri(
  uri: string | null | undefined,
  size: ImageSizePreset | number = "card"
): string | undefined {
  if (!uri || typeof uri !== "string") return undefined;

  // URIs locales (file://, content://, asset) o data: no se tocan.
  if (!uri.startsWith("http")) return uri;

  const markerIndex = uri.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) return uri; // no es Cloudinary

  const afterMarker = uri.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length);

  // Si ya hay una transformación puesta (primer segmento con "_" tipo
  // "w_300" o "c_fill"), no la duplicamos.
  const firstSegment = afterMarker.split("/")[0] ?? "";
  const looksLikeTransform = /(^|,)(w|h|c|q|f|dpr|ar|g|e|b|co|fl)_/.test(firstSegment);
  if (looksLikeTransform) return uri;

  const width = typeof size === "number" ? size : PRESET_WIDTH[size];
  const transform = `f_auto,q_auto,c_limit,w_${width}`;

  return (
    uri.slice(0, markerIndex + CLOUDINARY_UPLOAD_MARKER.length) +
    transform +
    "/" +
    afterMarker
  );
}
