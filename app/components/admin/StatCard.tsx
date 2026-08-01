import React from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { chartBaseConfig } from "./chartConfig";
import { StatCardData } from "./types";

const { width } = Dimensions.get("screen");

interface StatCardProps {
  stat: StatCardData;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export default function StatCard({ stat, opacity, translateY }: StatCardProps) {
  return (
    <Animated.View
      style={[styles.statCard, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.statTopRow}>
        <View style={styles.statIconCircle}>
          <Ionicons name={stat.icon} size={19} color="#FFFFFF" />
        </View>

        {stat.trend && (
          <View style={[styles.statTrend, !stat.trendPositive && styles.statTrendAlert]}>
            <Ionicons
              name={stat.trendPositive ? "trending-up" : "alert-circle-outline"}
              size={11}
              color={stat.trendPositive ? "#4CAF50" : "#E53935"}
            />
            <Text style={[styles.statTrendText, !stat.trendPositive && styles.statTrendTextAlert]}>
              {stat.trend}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.statTitle}>{stat.title}</Text>
      <Text style={styles.statValue}>{stat.value}</Text>

      {stat.breakdown ? (
        <View style={styles.breakdownArea}>
          <PieChart
            data={stat.breakdown.map((b) => ({
              name: b.label,
              population: b.value,
              color: b.color,
              legendFontColor: "#757575",
              legendFontSize: 10,
            }))}
            width={116}
            height={64}
            chartConfig={chartBaseConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            hasLegend={false}
            style={styles.donutChart}
          />

          <View style={styles.breakdownLegend}>
            {stat.breakdown.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.statSubtitleRow}>
          <Ionicons name="information-circle-outline" size={14} color="#A0A0A0" />
          <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    width: (width - 44) / 2,
    minHeight: 185,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F5A800",
    alignItems: "center",
    justifyContent: "center",
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  statTrendAlert: { backgroundColor: "#FFEBEE" },
  statTrendText: { fontSize: 9, fontWeight: "800", color: "#4CAF50" },
  statTrendTextAlert: { color: "#E53935" },
  statTitle: { fontSize: 12, fontWeight: "700", color: "#757575", marginTop: 12 },
  statValue: { fontSize: 28, fontWeight: "900", color: "#1A1A1A", marginTop: 1 },
  breakdownArea: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  donutChart: { marginLeft: -9 },
  breakdownLegend: { flex: 1, marginLeft: -3, gap: 4 },
  legendRow: { flexDirection: "row", alignItems: "center", minWidth: 0 },
  legendColor: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  legendLabel: { flex: 1, fontSize: 8, color: "#9E9E9E" },
  legendValue: { fontSize: 9, fontWeight: "800", color: "#757575" },
  statSubtitleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 9 },
  statSubtitle: { flex: 1, fontSize: 10, color: "#A0A0A0" },
});