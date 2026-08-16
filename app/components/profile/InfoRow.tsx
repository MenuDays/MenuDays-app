import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";

export default function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon as any}
        size={18}
        color={colors.primary}
        style={styles.infoIcon}
      />
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    width: 90,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
  },
});
