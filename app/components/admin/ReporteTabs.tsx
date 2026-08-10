import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ReportStatus } from "../../../services/reportsAdmin.service";

interface Tab {
  status: ReportStatus;
  label: string;
  count: number;
  color: string;
  backgroundColor: string;
}

interface ReporteTabsProps {
  selected: ReportStatus;
  counts: Record<ReportStatus, number>;
  onSelect: (status: ReportStatus) => void;
}

export default function ReporteTabs({ selected, counts, onSelect }: ReporteTabsProps) {
  const tabs: Tab[] = [
    {
      status: "pendiente",
      label: "Pendientes",
      count: counts.pendiente,
      color: "#FB8C00",
      backgroundColor: "#FFF3E0",
    },
    {
      status: "resuelto",
      label: "Resueltos",
      count: counts.resuelto,
      color: "#43A047",
      backgroundColor: "#E8F5E9",
    },
    {
      status: "archivado",
      label: "Archivados",
      count: counts.archivado,
      color: "#9E9E9E",
      backgroundColor: "#F5F5F5",
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
              isSelected && { backgroundColor: tab.backgroundColor, borderColor: tab.color },
            ]}
            onPress={() => onSelect(tab.status)}
          >
            <Text style={[styles.tabLabel, isSelected && { color: tab.color, fontWeight: "700" }]}>
              {tab.label}
            </Text>
            <Text style={[styles.tabCount, { color: isSelected ? tab.color : "#9E9E9E" }]}>
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