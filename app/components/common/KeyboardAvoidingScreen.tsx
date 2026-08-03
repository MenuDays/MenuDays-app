import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, ViewStyle } from "react-native";

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
// Uso: envolver el <ScreenHeader/> + <ScrollView/> de la pantalla con
// esto. El comportamiento difiere por plataforma porque así lo maneja
// mejor cada SO:
// - iOS: "padding" empuja el contenido hacia arriba.
// - Android: normalmente el manifest ya tiene windowSoftInputMode
//   adjustResize y no hace falta nada, pero "height" es un fallback
//   seguro si algún layout no lo respeta.
export default function KeyboardAvoidingScreen({
  children,
  style,
  keyboardVerticalOffset = 0,
}: KeyboardAvoidingScreenProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
