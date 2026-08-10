import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReportListItem } from "../../../services/reportsAdmin.service";

interface ReporteCardProps {
  report: ReportListItem;
  onPress: () => void;
}

export default function ReporteCard({ report, onPress }: ReporteCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Ionicons name="flag" size={20} color="#FFFFFF" />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {report.restaurante.nombre}
        </Text>
        <Text style={styles.motivo} numberOfLines={1}>
          {report.motivo}
        </Text>
        <Text style={styles.date}>
          {new Date(report.createdAt).toLocaleDateString("es-EC")}
        </Text>
      </View>

      <View style={styles.chevronCircle}>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E53935",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  motivo: {
    fontSize: 12.5,
    color: "#FB8C00",
    fontWeight: "600",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3E2723",
    alignItems: "center",
    justifyContent: "center",
  },
});