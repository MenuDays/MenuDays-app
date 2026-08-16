import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";

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
  const { colors } = useTheme();
  const showPlaceholder = !primaryLabel && !secondaryLabel;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="location" size={20} color={colors.primary} />
        </View>

        <View style={styles.info}>
          {showPlaceholder ? (
            <Text style={[styles.primary, { color: colors.text }]}>
              {loading ? "Buscando..." : "Ubicación no disponible"}
            </Text>
          ) : (
            <>
              {primaryLabel && (
                <Text style={[styles.primary, { color: colors.text }]} numberOfLines={1}>
                  {primaryLabel}
                </Text>
              )}
              {secondaryLabel && (
                <Text style={[styles.secondary, { color: colors.textSecondary }]} numberOfLines={1}>
                  {secondaryLabel}
                </Text>
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.editButton} onPress={onPressChange}>
          <Text style={[styles.editText, { color: colors.primary }]}>Cambiar</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
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
  },
  secondary: {
    fontSize: 13,
    marginTop: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  editText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
