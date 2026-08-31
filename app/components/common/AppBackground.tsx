import React from "react";
import { ImageBackground, StyleSheet } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

// Patrón de íconos de comida -- fondo global de la app. Va fijo detrás del
// viewport (no scrollea con el contenido).
const PATTERN_LIGHT = require("../../../assets/images/app-bg.png");
const PATTERN_DARK = require("../../../assets/images/app-bg-dark.jpg");

/**
 * Fondo global de la aplicación.
 *
 * Modo CLARO -> `fondo_claro` (patrón naranja sobre blanco).
 * Modo OSCURO -> `fondo_oscuro` (patrón naranja sobre negro).
 *
 * Para que se vea, el token `colors.background` es "transparent" en ambos
 * temas, así los contenedores de cada pantalla dejan pasar el patrón.
 * Headers, cards, navbars, modales y las "hojas" sobre un hero usan otros
 * tokens (surface/card/navbarBackground) y NO se ven afectados.
 */
export default function AppBackground({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  return (
    <ImageBackground
      source={isDark ? PATTERN_DARK : PATTERN_LIGHT}
      style={[styles.fill, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
