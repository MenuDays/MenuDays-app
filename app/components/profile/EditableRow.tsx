import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";

export default function EditableRow({
  icon,
  label,
  value,
  onChangeText,
  autoFocus,
  keyboardType,
  autoCapitalize,
  multiline,
  placeholder,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "url";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  placeholder?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.infoRow, multiline && styles.infoRowMultiline]}>
      <Ionicons
        name={icon as any}
        size={18}
        color={colors.primary}
        style={styles.infoIcon}
      />
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.infoInput,
          {
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          },
          multiline && styles.infoInputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoRowMultiline: {
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    width: 90,
  },
  // Fondo + borde propios -- antes este input se veía IGUAL que el texto
  // de solo-lectura de InfoRow (mismo tamaño/peso/color, sin marco), así
  // que "modo edición" no se distinguía de "modo vista" a simple vista.
  infoInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoInputMultiline: {
    textAlign: "left",
    minHeight: 60,
    paddingTop: 10,
  },
});
