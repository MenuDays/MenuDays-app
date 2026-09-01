// Ancho máximo real de las 3 navbars flotantes (admin, restaurante,
// comensal) -- pensado para que en celular ocupen casi todo el ancho
// (como hasta ahora) pero en tablet no se estiren de punta a punta de
// la pantalla, lo que separaba mucho el ícono del texto de cada tab y
// se veía desfasado. A partir de este ancho, quedan centradas.
const NAVBAR_MAX_WIDTH = 480;

// Antes el margen lateral solo tenía un TOPE fijo (26px) pensando que
// eso alcanzaba para no flotar demasiado en tablets -- pero un tope de
// margen no limita el ANCHO del contenido: en una tablet ancha, la
// navbar igual terminaba ocupando casi toda la pantalla con esos 26px
// de cada lado. Acá se calcula el margen necesario para que el ancho
// real nunca supere NAVBAR_MAX_WIDTH.
export function getNavbarSideMargin(screenWidth: number): number {
  const compactMargin = Math.max(10, Math.min(26, screenWidth * 0.045));
  const compactContentWidth = screenWidth - compactMargin * 2;

  if (compactContentWidth <= NAVBAR_MAX_WIDTH) {
    return compactMargin;
  }

  return (screenWidth - NAVBAR_MAX_WIDTH) / 2;
}

// Altura VISUAL que ocupan las navbars flotantes (restaurante/admin/
// comensal) sin contar el safe-area inferior. Cubre el caso más alto de
// las tres (la de restaurante, que además "levanta" el botón +):
//   ~16 (aire del botón elevado) + ~62 (fila de íconos+label) +
//   ~10 (margen inferior) + un colchón.
// Las pantallas con navbar flotante deben dejar este espacio + el inset
// real al final de su scroll, para que el último elemento (típicamente
// "Cerrar sesión") no quede tapado ni pegado a la navbar. Se prefiere
// esto -- padding calculado con el inset real -- antes que posiciones
// absolutas frágiles.
export const FLOATING_NAV_BAR_HEIGHT = 96;

/**
 * Espacio a reservar al final de una pantalla que tiene una navbar
 * flotante encima, para que su contenido no quede tapado.
 *
 * @param bottomInset  El `useSafeAreaInsets().bottom` de la pantalla.
 * @param extra        Aire adicional entre el último elemento y la navbar.
 */
export function getFloatingNavClearance(bottomInset: number, extra = 24): number {
  return FLOATING_NAV_BAR_HEIGHT + Math.max(bottomInset, 0) + extra;
}
