import { Stack } from "expo-router";

// Antes había acá un drawer lateral (menú deslizable) que se abría con un
// gesto de swipe desde el borde izquierdo. Se sacó por completo: la zona
// invisible de detección del gesto vivía superpuesta (zIndex 999) sobre
// TODA pantalla del restaurante, justo en el borde izquierdo donde vive
// el botón "atrás" de cada header -- terminaba comiéndose esos toques y
// las flechas de volver quedaban sin responder. La navegación que ese
// drawer ofrecía (Dashboard/Perfil/Menús/Platos/Promociones/Galería/Mi
// local/Configurar delivery) ya está cubierta por RestaurantBottomNav +
// las quick actions del Dashboard, así que no se perdió ningún acceso.
export default function RestaurantLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
