import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AdminApplicationStatus } from "../../../services/restaurantApplicationsAdmin.service";

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
  const tabs: Tab[] = [
    {
      status: "accepted",
      label: "Aceptadas",
      count: counts.accepted,
      color: "#43A047",
      backgroundColor: "#E8F5E9",
    },
    {
      status: "pending",
      label: "Pendientes",
      count: counts.pending,
      color: "#FB8C00",
      backgroundColor: "#FFF3E0",
    },
    {
      status: "rejected",
      label: "Rechazadas",
      count: counts.rejected,
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
                { color: isSelected ? tab.color : "#9E9E9E" },
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

const styles = StyleSheet.create({
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
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  tabLabel: {
    fontSize: 11,
    color: "#3E2723",
    fontWeight: "500",
  },
  tabCount: {
    fontSize: 11,
    fontWeight: "700",
  },
});