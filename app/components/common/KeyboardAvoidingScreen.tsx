import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

interface KeyboardAvoidingScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Alto de cosas fijas arriba (ej. header con back button) que no se
   * cuentan solas, para que el ajuste no se pase de largo en iOS. */
  keyboardVerticalOffset?: number;
}

// Wrapper genérico para pantallas con formularios: evita que el teclado
// tape los inputs de más abajo. Se repetía en cada form.tsx (menu, platos,
// promociones, register, login, perfil, etc.) así que se centraliza acá.
//
// Usa el KeyboardAvoidingView de react-native-keyboard-controller (no el
// de React Native) en las dos plataformas: el nativo de RN, en Android,
// dependía de que android:windowSoftInputMode="resize" (el default de
// Expo) resizee la ventana -- pero con edgeToEdgeEnabled activado (ver
// app.json) eso no siempre pasa en un build standalone, y los inputs
// quedaban tapados por el teclado. Este sigue el alto real del teclado
// nativo directamente (vía reanimated), así que funciona igual en ambas
// plataformas sin depender de eso.
export default function KeyboardAvoidingScreen({
  children,
  style,
  keyboardVerticalOffset = 0,
}: KeyboardAvoidingScreenProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
