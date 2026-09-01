import { Stack } from 'expo-router';

// OJO: NO montar acá otro <KeyboardProvider>. El provider de
// react-native-keyboard-controller ya vive UNA sola vez en la raíz
// (app/_layout.tsx). Tenerlo anidado hacía que KeyboardAwareScrollView
// de las pantallas de Auth (login, registro, registrar restaurante) no
// recibiera bien los eventos del teclado y NO scrolleara hasta el input
// enfocado -> el campo quedaba tapado por el teclado.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
