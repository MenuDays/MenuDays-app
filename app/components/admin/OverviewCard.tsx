import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { chartBaseConfig } from "./chartConfig";

// Se limita a un ancho "de celular" para que el LineChart (necesita un
// width numérico fijo, no admite porcentajes) no se estire enorme en tablets.
const { width: rawScreenWidth } = Dimensions.get("screen");
const width = Math.min(rawScreenWidth, 480);

interface OverviewCardProps {
  totalLabel: string;
  totalValue: number;
  growthLabel: string;
  weeklyData: number[];
  weeklyLabels: string[];
  scaleAnim: Animated.Value;
}

export default function OverviewCard({
  totalLabel,
  totalValue,
  growthLabel,
  weeklyData,
  weeklyLabels,
  scaleAnim,
}: OverviewCardProps) {
  return (
    <Animated.View
      style={[styles.overviewCard, { transform: [{ scale: scaleAnim }] }]}
    >
      <View style={styles.overviewTopRow}>
        <View style={styles.overviewTitleBlock}>
          <View style={styles.eyebrowRow}>
            <View style={styles.liveDot} />
            <Text style={styles.eyebrow}>ACTIVIDAD GENERAL</Text>
          </View>

          <Text style={styles.overviewTitle}>{totalLabel}</Text>

          <View style={styles.overviewMetricRow}>
            <Text style={styles.overviewMetric}>{totalValue}</Text>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={14} color="#4CAF50" />
              <Text style={styles.growthText}>{growthLabel}</Text>
            </View>
          </View>

          <Text style={styles.overviewSubtitle}>
            Comparado con la semana anterior
          </Text>
        </View>

        <View style={styles.chartIconCircle}>
          <Ionicons name="analytics-outline" size={22} color="#F5A800" />
        </View>
      </View>

      <LineChart
        data={{ labels: weeklyLabels, datasets: [{ data: weeklyData }] }}
        width={width - 64}
        height={170}
        chartConfig={chartBaseConfig}
        bezier
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels
        withHorizontalLabels={false}
        fromZero
        style={styles.trendChart}
      />

      <View style={styles.chartFooter}>
        <View style={styles.chartLegend}>
          <View style={styles.legendDot} />
          <Text style={styles.chartLegendText}>Solicitudes</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  overviewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  overviewTitleBlock: { flex: 1 },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4CAF50" },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: "#9E9E9E" },
  overviewTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A1A" },
  overviewMetricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  overviewMetric: { fontSize: 38, lineHeight: 44, fontWeight: "900", color: "#F5A800" },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  growthText: { fontSize: 12, fontWeight: "800", color: "#4CAF50" },
  overviewSubtitle: { fontSize: 11, color: "#9E9E9E", marginTop: 2 },
  chartIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF6E2",
  },
  trendChart: { marginTop: 12, marginLeft: -18, borderRadius: 16 },
  chartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -2,
  },
  chartLegend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#F5A800" },
  chartLegendText: { fontSize: 11, color: "#9E9E9E" },
});