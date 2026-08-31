import React from "react";
import { View, Text, StyleSheet } from "react-native";

// "Tono" en vez de un enum de estados hardcodeado -- así este mismo
// componente sirve para el estado de un menú (Publicado/Oculto/Agotado),
// de un plato (Disponible/Agotado), de una promoción (Activa/Programada/
// Finalizada) o del restaurante (Abierto/Cerrado/Cerrado temporalmente/
// Vacaciones), sin importar el vocabulario de cada módulo.
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}

const TONE_COLORS: Record<StatusTone, { color: string; background: string }> = {
  success: { color: "#43A047", background: "#E8F5E9" },
  warning: { color: "#FB8C00", background: "#FFF3E0" },
  danger: { color: "#E53935", background: "#FFEBEE" },
  neutral: { color: "#9E9E9E", background: "#F0F0F0" },
  info: { color: "#1E88E5", background: "#E3F2FD" },
};

export default function StatusBadge({ label, tone }: StatusBadgeProps) {
  const colors = TONE_COLORS[tone];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    // No se achica: el título de la card se achica antes que el badge.
    flexShrink: 0,
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});