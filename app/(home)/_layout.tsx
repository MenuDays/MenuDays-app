import { Stack } from "expo-router";

// Stack real que envuelve el grupo de tabs (Inicio/Explorar/Menús/Pedidos/
// Perfil, ver (tabs)/_layout.tsx) más todas las pantallas de detalle/flujo
// que se navegan "hacia adentro" desde ahí (restaurante-detalle,
// restaurante-catalogo, pedido-producto, etc.).
//
// Antes TODAS estas pantallas vivían como hermanas dentro de un único
// <Tabs>, con las que no son tab ocultas via href:null. Eso funcionaba
// para MOSTRARLAS, pero el botón "atrás" heredaba el historial de tabs de
// React Navigation (no es un push/pop lineal) en vez de un pop real de
// stack, así que podía terminar en cualquier pantalla al volver. Anidando
// un <Stack> de verdad acá arriba, cada pantalla que se navega con
// router.push() queda en una pila real y router.back() siempre vuelve
// exactamente a la pantalla anterior.
//
// Los paths públicos (/(home)/perfil, /(home)/pedido-producto, etc.) NO
// cambian: los grupos entre paréntesis como "(tabs)" no forman parte de
// la URL, así que ningún router.push/Link existente en el resto de la
// app necesitó tocarse.
export default function HomeStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
