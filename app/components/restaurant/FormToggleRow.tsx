import React, { useMemo } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface FormToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function FormToggleRow({
  label,
  value,
  onValueChange,
}: FormToggleRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: "#D9D9D9",
          true: "#FFD180",
        }}
        thumbColor={value ? "#FB8C00" : "#FFFFFF"}
        ios_backgroundColor="#D9D9D9"
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: colors.card,
    borderRadius: 14,

    paddingHorizontal: 16,
    paddingVertical: 14,

    marginBottom: 14,

    borderWidth: 1,
    borderColor: colors.border,
  },

  label: {
    flex: 1,

    fontSize: 15,
    fontWeight: "600",
    color: colors.text,

    marginRight: 16,
  },
});