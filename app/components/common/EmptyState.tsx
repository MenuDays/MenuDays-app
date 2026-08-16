import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ImageSourcePropType } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

type EmptyStateProps = {
  /** require(...) de la imagen mascota a mostrar */
  mascot: ImageSourcePropType;
  /** Texto principal debajo de la mascota */
  text: string;
  /** Tamaño del mascot en px (ancho = alto). Default 160. */
  size?: number;
  /** Si se pasa, muestra un botón de acción debajo del texto (ej. "Reintentar", "Volver") */
  actionLabel?: string;
  onAction?: () => void;
  /** "error" tiñe el texto en rojo suave y el botón en tono error en vez de primary */
  tone?: "neutral" | "error";
};

export function EmptyState({
  mascot,
  text,
  size = 160,
  actionLabel,
  onAction,
  tone = "neutral",
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Image
        source={mascot}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      <Text style={[styles.text, tone === "error" && styles.textError]}>{text}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.button, tone === "error" && styles.buttonError]}
          onPress={onAction}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
    gap: 10,
  },
  text: {
    textAlign: "center",
    color: colors.placeholder,
    fontSize: 13,
    lineHeight: 19,
  },
  textError: {
    color: colors.text,
  },
  button: {
    marginTop: 6,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  buttonError: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});