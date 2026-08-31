import React, { useMemo } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";
import { AppAlert } from "../common/AppAlert";

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  // Para el teléfono del restaurante en la solicitud -- el admin lo
  // necesita seguido para agendarlo/llamar, así que copiarlo a mano
  // letra por letra es innecesario.
  copyable?: boolean;
}

export default function InfoRow({ icon, label, value, copyable }: InfoRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function handleCopy() {
    await Clipboard.setStringAsync(value);
    AppAlert.alert("Copiado", `${label} copiado al portapapeles.`);
  }

  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon as any} size={16} color="#FB8C00" />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {copyable && (
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy} hitSlop={8}>
          <Ionicons name="copy-outline" size={17} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.text,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
});