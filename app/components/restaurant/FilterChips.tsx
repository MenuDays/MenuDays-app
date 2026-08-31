import React, { useMemo } from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
  // Color del chip cuando está seleccionado. "Todos" usa el naranja de
  // marca; el resto puede tomar el mismo color que su StatusBadge
  // correspondiente (verde para Publicados, rojo para Agotados, etc.)
  activeColor: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      style={styles.scrollView}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? option.activeColor : colors.card,
                borderColor: option.activeColor,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isActive ? "#FFFFFF" : option.activeColor },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
    height: 58, // chip (42) + paddingTop (12) + paddingBottom (4)
  },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 4,
  },
  chip: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
});