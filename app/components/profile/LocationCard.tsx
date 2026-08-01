import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LocationCard({
  primaryLabel,
  secondaryLabel,
  loading,
  onPressChange,
}: {
  primaryLabel: string | null;
  secondaryLabel: string | null;
  loading?: boolean;
  onPressChange: () => void;
}) {
  const showPlaceholder = !primaryLabel && !secondaryLabel;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="location" size={20} color="#F5A800" />
        </View>

        <View style={styles.info}>
          {showPlaceholder ? (
            <Text style={styles.primary}>
              {loading ? "Buscando..." : "Ubicación no disponible"}
            </Text>
          ) : (
            <>
              {primaryLabel && (
                <Text style={styles.primary} numberOfLines={1}>
                  {primaryLabel}
                </Text>
              )}
              {secondaryLabel && (
                <Text style={styles.secondary} numberOfLines={1}>
                  {secondaryLabel}
                </Text>
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.editButton} onPress={onPressChange}>
          <Text style={styles.editText}>Cambiar</Text>
          <Ionicons name="chevron-forward" size={14} color="#F5A800" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  primary: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  secondary: {
    fontSize: 13,
    color: "#757575",
    marginTop: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  editText: {
    fontSize: 13,
    color: "#F5A800",
    fontWeight: "600",
  },
});