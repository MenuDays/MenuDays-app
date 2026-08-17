import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PublishFabProps {
  label: string;
  onPress: () => void;
}

// Botón flotante grande para "crear nuevo" (menú/plato/promoción), en
// vez del ícono chiquito de 22px que vivía en el header -- ahí quedaba
// casi invisible. Reemplaza ese ícono en menu.tsx/platos.tsx/promociones.tsx
// para que las 3 pantallas se vean consistentes entre sí.
export default function PublishFab({ label, onPress }: PublishFabProps) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: 84 + insets.bottom }]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#FFB74D", "#FB8C00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fabGradient}
      >
        <Ionicons name="add-circle" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#FB8C00",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
