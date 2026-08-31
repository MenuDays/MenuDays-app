import { Dimensions, PixelRatio, useWindowDimensions } from "react-native";

// ==========================================================================
// Escalado responsivo -- para que tamaños, paddings e iconos NO queden
// fijos en px y se vean igual de proporcionados en un iPhone SE (~320pt)
// que en un Pro Max (~430pt) o un Android grande.
//
// Base de diseño: 375pt de ancho (iPhone X/11/12/13/14 "normales"), que
// es el ancho para el que están pensados la mayoría de los números
// hardcodeados de la app.
//
// Dos escalas distintas a propósito:
//  - scaleSize / ms  -> layout (ancho, alto, padding, margin, radios,
//    tamaño de iconos). Escala casi lineal pero con TOPE en 1.6x para que
//    en tablet no explote todo de tamaño.
//  - scaleFont / fs  -> tipografía. Escala MUCHO más suave (0.9x .. 1.3x)
//    porque el texto se vuelve incómodo si crece/decrece linealmente con
//    la pantalla; además redondea para no dejar medios pixeles borrosos.
// ==========================================================================

const GUIDELINE_BASE_WIDTH = 375;

const SIZE_MIN_FACTOR = 0.86;
const SIZE_MAX_FACTOR = 1.6;
const FONT_MIN_FACTOR = 0.9;
const FONT_MAX_FACTOR = 1.3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function widthOrDefault(width?: number): number {
  return width && width > 0 ? width : Dimensions.get("window").width;
}

/** Escala un valor de LAYOUT (padding, tamaño de icono, ancho, alto...). */
export function scaleSize(size: number, width?: number): number {
  const factor = clamp(widthOrDefault(width) / GUIDELINE_BASE_WIDTH, SIZE_MIN_FACTOR, SIZE_MAX_FACTOR);
  return PixelRatio.roundToNearestPixel(size * factor);
}

/** Escala un tamaño de FUENTE (más conservador que scaleSize). */
export function scaleFont(size: number, width?: number): number {
  const factor = clamp(widthOrDefault(width) / GUIDELINE_BASE_WIDTH, FONT_MIN_FACTOR, FONT_MAX_FACTOR);
  return Math.round(size * factor);
}

/**
 * Hook para usar dentro de componentes: se re-evalúa solo cuando cambia
 * el tamaño de la ventana (rotación, split-view, etc.).
 *
 *   const { ms, fs, width } = useResponsive();
 *   <Icon size={ms(24)} />
 *   <Text style={{ fontSize: fs(14) }} />
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    /** margin/size scale */
    ms: (size: number) => scaleSize(size, width),
    /** font scale */
    fs: (size: number) => scaleFont(size, width),
    /** ancho * fracción, redondeado (ej. wp(0.15) = 15% del ancho) */
    wp: (fraction: number) => Math.round(width * fraction),
    isSmall: width < 360,
    isTablet: width >= 768,
  };
}
