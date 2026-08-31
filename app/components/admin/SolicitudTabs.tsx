import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AdminApplicationStatus } from "../../../services/restaurantApplicationsAdmin.service";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface Tab {
  status: AdminApplicationStatus;
  label: string;
  count: number;
  color: string; // color de acento cuando está seleccionado
  backgroundColor: string;
}

interface SolicitudTabsProps {
  selected: AdminApplicationStatus;
  counts: Record<AdminApplicationStatus, number>;
  onSelect: (status: AdminApplicationStatus) => void;
}

export default function SolicitudTabs({
  selected,
  counts,
  onSelect,
}: SolicitudTabsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const tabs: Tab[] = [
    {
      status: "aprobada",
      label: "Aceptadas",
      count: counts.aprobada,
      color: "#43A047",
      backgroundColor: "#E8F5E9",
    },
    {
      status: "pendiente",
      label: "Pendientes",
      count: counts.pendiente,
      color: "#FB8C00",
      backgroundColor: "#FFF3E0",
    },
    {
      status: "rechazada",
      label: "Rechazadas",
      count: counts.rechazada,
      color: "#E53935",
      backgroundColor: "#FFEBEE",
    },
  ];

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const isSelected = tab.status === selected;
        return (
          <TouchableOpacity
            key={tab.status}
            style={[
              styles.tab,
              isSelected && {
                backgroundColor: tab.backgroundColor,
                borderColor: tab.color,
              },
            ]}
            onPress={() => onSelect(tab.status)}
          >
            <Text
              style={[
                styles.tabLabel,
                isSelected && { color: tab.color, fontWeight: "700" },
              ]}
            >
              {tab.label}
            </Text>
            <Text
              style={[
                styles.tabCount,
                { color: isSelected ? tab.color : colors.textSecondary },
              ]}
            >
              {tab.count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.text,
    fontWeight: "500",
  },
  tabCount: {
    fontSize: 11,
    fontWeight: "700",
  },
});