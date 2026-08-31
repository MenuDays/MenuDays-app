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
