// ==========================================================================
// FIX GLOBAL de texto cortado / descentrado en algunos dispositivos
// (ej. Motorola G14) mientras en otros (Samsung) se ve bien.
//
// Son DOS problemas distintos, los dos globales:
//
//   A) Escalado de fuente del SO: por defecto RN agranda TODO el texto
//      según "tamaño de fuente" del sistema (Ajustes > Pantalla). Con esa
//      opción alta, cada palabra crece y se sale del contenedor
//      ("Siguiente" -> "Siguient"). -> se apaga para toda la app.
//
//   B) Recorte VERTICAL de cada letra en Android: si un estilo tiene un
//      `lineHeight` muy ajustado (cerca del `fontSize`), Android corta la
//      parte de arriba/abajo de cada glifo -- y los acentos y colas del
//      español (á, ñ, g, j, p, ¿) se ven mochas. En Samsung la fuente
//      del sistema tiene métricas más apretadas y no se nota; en la
//      fuente de otros (Motorola/AOSP = Roboto) sí. `includeFontPadding:
//      false` empeora lo mismo. -> se corrige TODO estilo al crearse.
//
// Todo va envuelto en try/catch: si algo falla, es un no-op y la app
// sigue funcionando igual que antes.
//
// Se auto-ejecuta al importar este módulo (side effect). En app/_layout.tsx
// va como PRIMER import (bare: `import "../utils/textDefaults";`) para que
// corra antes de que cualquier otro módulo cree su StyleSheet o renderice.
// ==========================================================================
import React from "react";
import { Platform, StyleSheet, Text, TextInput } from "react-native";

type AnyProps = Record<string, any> | null | undefined;

// -------------------------------------------------------------------------
// A) Defaults de <Text>/<TextInput>: sin escalado de fuente del sistema.
// -------------------------------------------------------------------------
const TEXT_DEFAULTS: Record<string, unknown> = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

// Estilo base que se antepone (como DEFAULT, cualquier estilo propio lo
// pisa) a todo <Text>/<TextInput> en Android:
//
//  - minWidth:0 -> deja que un <Text> en fila flex se achique de verdad y
//    muestre "..." en vez de que Android lo mida corto y coma la última
//    letra.
//
//  - includeFontPadding:false -> la caja del texto mide EXACTAMENTE su
//    lineHeight, sin el padding extra que Android calcula a partir de las
//    métricas del font. Ese padding varía entre fuentes Y entre versiones
//    de Android (el StaticLayout cambió en API 28), así que con
//    includeFontPadding:true el MISMO texto ocupaba distinto alto en un
//    Motorola/AOSP viejo y en un Samsung nuevo -> se salía de botones/
//    badges de alto fijo y quedaba descentrado. Con `false` el alto es
//    determinístico. Los acentos y colas del español NO se recortan
//    porque fixStyleObject GARANTIZA un lineHeight holgado (>= ~1.4x el
//    fontSize) en todo estilo de texto.
//
//  - textAlignVertical:"center" -> cuando el <Text> tiene alto propio o
//    sobra espacio en la línea, los glifos quedan centrados en vez de
//    pegados arriba (otra causa de "se ve descentrado").
//
// OJO: NO se pone fontFamily acá. La fuente (Inter) se aplica en fixStyleObject
// (estilo por estilo). Ponerla acá rompería la herencia de fuente de los
// <Text> ANIDADOS (ej. "Menu<Text>Days</Text>": "Days" perdería el peso
// del padre).
const BASE_TEXT_STYLE = {
  minWidth: 0,
  includeFontPadding: false,
  textAlignVertical: "center",
} as const;

// Barato a propósito: solo antepone el estilo base (fontFamily + minWidth).
// El grueso del saneo (Inter por peso, lineHeight, etc.) lo hace
// patchStyleSheetCreate UNA vez por estilo al crearse, no en cada render.
// Los pocos estilos inline con fontWeight/fontSize (4 en toda la app) se
// arreglan a mano en su archivo.
function withTextDefaults(type: unknown, props: AnyProps): AnyProps {
  if (type !== Text && type !== TextInput) return props;

  const next: Record<string, any> = { ...(props ?? {}) };
  for (const key of Object.keys(TEXT_DEFAULTS)) {
    if (next[key] === undefined) next[key] = TEXT_DEFAULTS[key];
  }
  // Solo <Text> (no <TextInput>): en inputs, includeFontPadding /
  // textAlignVertical afectan la posición del cursor y del texto multiline,
  // y ya están afinados por componente -> no se tocan globalmente.
  if (type === Text && Platform.OS === "android") {
    if (next.textBreakStrategy === undefined) next.textBreakStrategy = "simple";
    // BASE_TEXT_STYLE va PRIMERO -> es un default; cualquier valor propio
    // del componente (incluido includeFontPadding:true si algún caso
    // puntual lo necesitara) lo pisa.
    next.style = next.style == null ? BASE_TEXT_STYLE : [BASE_TEXT_STYLE, next.style];
  }

  return next;
}

function patchRuntime(runtime: any): void {
  if (!runtime) return;
  for (const fnName of ["jsx", "jsxs", "jsxDEV"] as const) {
    const original = runtime[fnName];
    if (typeof original !== "function" || original.__menudaysPatched) continue;
    const patched = function (this: unknown, type: unknown, props: AnyProps, ...rest: unknown[]) {
      return original.call(this, type, withTextDefaults(type, props), ...rest);
    };
    patched.__menudaysPatched = true;
    try {
      runtime[fnName] = patched;
    } catch {
      /* export no editable -> se ignora */
    }
  }
}

// -------------------------------------------------------------------------
// B) Saneo de estilos: fuente Inter por peso + lineHeight seguro + sin
//    includeFontPadding:false + aire para letterSpacing. Se aplica a CADA
//    objeto que pase por StyleSheet.create (que es como se declara casi
//    todo estilo en la app) y a los estilos inline de cada <Text>.
// -------------------------------------------------------------------------

// lineHeight / fontSize.
// - Si NO hay lineHeight en un estilo de texto -> se le pone SAFE_RATIO.
//   Con includeFontPadding:false (ver BASE_TEXT_STYLE) la caja mide
//   exactamente el lineHeight, así que hay que garantizar uno holgado
//   para que los acentos (á, ñ) y las colas (g, j, p, ¿) del español
//   entren en Inter. 1.4x es holgado sin agrandar el diseño (Inter
//   natural ronda 1.21x, así que 1.4x deja aire de sobra y MANTIENE el
//   mismo ritmo vertical que tenía la app con Poppins).
// - Si hay un lineHeight EXPLÍCITO muy ajustado en texto CHICO (donde el
//   riesgo de recorte de acento es real), se sube a SAFE. En texto
//   grande (fontSize > 20: números de estadística, títulos en mayúscula)
//   NO se toca: ahí un lineHeight ajustado suele ser una decisión de
//   diseño y no hay acentos/colas en juego.
const SAFE_LINE_HEIGHT_RATIO = 1.4;
const TIGHT_LINE_HEIGHT_RATIO = 1.35;
const SMALL_TEXT_MAX_FONT_SIZE = 20;

// Fuente propia de la app: mismo render en cualquier dispositivo. Las
// claves coinciden con las que se cargan en app/_layout.tsx (useFonts).
//
// Inter (antes Poppins): fuente de UI diseñada para pantallas, con
// métricas verticales MÁS compactas y estables que Poppins (línea natural
// ~1.21x vs ~1.5x) y los diacríticos/colas del español bien contenidos ->
// en Android viejo/AOSP (Motorola, etc.) ya no se recorta ni se descentra
// el texto. Misma x-height que Poppins (~0.547) -> el tamaño percibido y
// el ancho del texto NO cambian: la UI conserva sus proporciones.
export const APP_FONT_REGULAR = "Inter_400Regular";
const APP_FONT_ITALIC = "Inter_400Regular_Italic";

// RN en Android necesita el nombre EXACTO de la variante por peso (no
// sabe "engordar" un .ttf), así que mapeamos fontWeight -> archivo.
function appFontFamilyForWeight(weight: unknown): string {
  let w: number;
  if (weight == null || weight === "normal") w = 400;
  else if (weight === "bold") w = 700;
  else w = Number(weight) || 400;

  if (w >= 900) return "Inter_900Black";
  if (w >= 800) return "Inter_800ExtraBold";
  if (w >= 700) return "Inter_700Bold";
  if (w >= 600) return "Inter_600SemiBold";
  if (w >= 500) return "Inter_500Medium";
  return APP_FONT_REGULAR;
}

// Estilos ya procesados -> no repetir trabajo si StyleSheet.create se
// llama dos veces con el mismo objeto.
const fixedStyles = new WeakSet<object>();

function fixStyleObject(style: any): void {
  if (!style || typeof style !== "object" || fixedStyles.has(style)) return;
  fixedStyles.add(style);

  // --- Fuente Inter ---
  // Si el estilo es "de texto" (tiene fontSize / fontWeight / fontStyle) y
  // NO fijó ya una fontFamily propia (ni Inter ni un icon-font ni nada),
  // le ponemos la Inter del peso que corresponda y sacamos el
  // fontWeight (el peso ya va en el nombre del archivo -> evita el "faux
  // bold" que ensancha y recorta el texto en Android).
  const looksLikeText =
    style.fontSize != null || style.fontWeight != null || style.fontStyle != null;

  if (looksLikeText && style.fontFamily == null) {
    if (style.fontStyle === "italic") {
      style.fontFamily = APP_FONT_ITALIC;
      delete style.fontStyle;
    } else {
      style.fontFamily = appFontFamilyForWeight(style.fontWeight);
    }
    delete style.fontWeight;
  }

  // lineHeight: se garantiza uno holgado en cada estilo de TEXTO.
  const fs = style.fontSize;
  if (typeof fs === "number") {
    const lh = style.lineHeight;
    const safe = Math.round(fs * SAFE_LINE_HEIGHT_RATIO);
    // Si el estilo tiene fontSize + height juntos casi siempre es un
    // <TextInput> (o un <Text> con alto fijo): ahí NO se agrega lineHeight
    // -- en Android puede desplazar el cursor / el texto multiline.
    const looksLikeInputOrFixedBox = style.height != null;
    if (looksLikeInputOrFixedBox) {
      // no se toca el lineHeight
    } else if (typeof lh !== "number") {
      // Sin lineHeight -> depende de métricas del font (varía por
      // dispositivo). Se fija uno.
      style.lineHeight = safe;
    } else if (fs <= SMALL_TEXT_MAX_FONT_SIZE && lh < fs * TIGHT_LINE_HEIGHT_RATIO) {
      // Texto chico con lineHeight muy ajustado -> riesgo real de recorte
      // de acento/cola. Se sube (nunca se BAJA un lineHeight elegido a
      // propósito, solo se sube el que quedó corto).
      style.lineHeight = Math.max(lh, safe);
    }
  }

  // includeFontPadding: ya NO se fuerza a `true` acá. El default global es
  // `false` (BASE_TEXT_STYLE) para que el alto de la caja sea
  // determinístico; el lineHeight holgado de arriba cubre los acentos. Si
  // un estilo puntual pone includeFontPadding a mano, se respeta.

  // letterSpacing positivo: Android no cuenta el del último caracter al
  // medir el ancho -> se come la última letra. Le damos ese aire, salvo
  // que el estilo ya tenga padding horizontal propio.
  const ls = style.letterSpacing;
  if (
    typeof ls === "number" &&
    ls > 0 &&
    style.paddingRight == null &&
    style.paddingHorizontal == null &&
    style.padding == null
  ) {
    style.paddingRight = Math.ceil(ls) + 1;
  }
}

function patchStyleSheetCreate(): void {
  const anySS = StyleSheet as unknown as {
    create: (styles: any) => any;
    __menudaysPatched?: boolean;
  };
  const original = anySS.create;
  if (typeof original !== "function" || anySS.__menudaysPatched) return;

  const patched = function (styles: any) {
    try {
      if (styles && typeof styles === "object") {
        for (const key of Object.keys(styles)) fixStyleObject(styles[key]);
      }
    } catch {
      /* si algo raro -> se deja el estilo tal cual */
    }
    return original(styles);
  };

  try {
    anySS.create = patched;
    anySS.__menudaysPatched = true;
  } catch {
    /* no editable -> se ignora */
  }
}

// -------------------------------------------------------------------------

let applied = false;

export function applyGlobalTextDefaults(): void {
  if (applied) return;
  applied = true;

  // El problema es de iOS/Android. En web no aplica y parchear el runtime
  // de JSX podría interferir con el render estático -> se salta.
  if (Platform.OS === "web") return;

  // --- B) Saneo de estilos: ANTES que nada, para agarrar todo
  //        StyleSheet.create de todos los módulos que carguen después.
  try {
    patchStyleSheetCreate();
  } catch {
    /* no-op */
  }

  // --- A) Defaults de Text/TextInput vía runtime de JSX. `require` con
  //        string LITERAL (Metro no admite require dinámico).
  try {
    patchRuntime(require("react/jsx-runtime"));
  } catch {
    /* no-op */
  }
  try {
    patchRuntime(require("react/jsx-dev-runtime"));
  } catch {
    /* no-op */
  }

  // React.createElement (por si algún dependency usa el runtime clásico).
  try {
    const anyReact = React as unknown as {
      createElement: (...args: any[]) => unknown;
      __menudaysCreateElementPatched?: boolean;
    };
    if (typeof anyReact.createElement === "function" && !anyReact.__menudaysCreateElementPatched) {
      const originalCreateElement = anyReact.createElement;
      anyReact.createElement = function (type: unknown, props: AnyProps, ...children: unknown[]) {
        return originalCreateElement.call(React, type, withTextDefaults(type, props), ...children);
      };
      anyReact.__menudaysCreateElementPatched = true;
    }
  } catch {
    /* no-op */
  }
}

// Side effect: se aplica apenas se importa este módulo.
applyGlobalTextDefaults();
