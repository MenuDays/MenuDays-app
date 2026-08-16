import React from "react";
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { chartBaseConfig } from "./chartConfig";
import { StatCardData } from "./types";

// Se limita a un ancho "de celular" para el cálculo de la grilla de 2
// columnas: en tablets, sin esto, cada card terminaba enorme y estirada.
const { width: rawScreenWidth } = Dimensions.get("screen");
const width = Math.min(rawScreenWidth, 480);

interface StatCardProps {
  stat: StatCardData;
  opacity: Animated.Value;
  translateY: Animated.Value;
  onPress?: () => void;
}

export default function StatCard({ stat, opacity, translateY, onPress }: StatCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      style={[styles.statCardWrap, { opacity, transform: [{ translateY }] }]}
    >
      <Wrapper
        style={styles.statCard}
        {...(onPress ? { onPress, activeOpacity: 0.8 } : {})}
      >
        <View style={styles.statTopRow}>
          <View style={styles.statIconCircle}>
            <Ionicons name={stat.icon} size={17} color="#FFFFFF" />
          </View>

          {stat.trend ? (
            <View style={[styles.statTrend, !stat.trendPositive && styles.statTrendAlert]}>
              <Ionicons
                name={stat.trendPositive ? "trending-up" : "alert-circle-outline"}
                size={10}
                color={stat.trendPositive ? "#4CAF50" : "#E53935"}
              />
              <Text style={[styles.statTrendText, !stat.trendPositive && styles.statTrendTextAlert]}>
                {stat.trend}
              </Text>
            </View>
          ) : onPress ? (
            <Ionicons name="chevron-forward" size={16} color="#C9C9C9" />
          ) : null}
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
              width={100}
              height={54}
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
                  <Text style={styles.legendLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.legendValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : stat.subtitle ? (
          <View style={styles.statSubtitleRow}>
            <Ionicons name="information-circle-outline" size={13} color="#A0A0A0" />
            <Text style={styles.statSubtitle} numberOfLines={1}>{stat.subtitle}</Text>
          </View>
        ) : null}
      </Wrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  statCardWrap: {
    width: (width - 44) / 2,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 11,
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
    paddingVertical: 3,
  },
  statTrendAlert: { backgroundColor: "#FFEBEE" },
  statTrendText: { fontSize: 9, fontWeight: "800", color: "#4CAF50" },
  statTrendTextAlert: { color: "#E53935" },
  statTitle: { fontSize: 11.5, fontWeight: "700", color: "#757575", marginTop: 10 },
  statValue: { fontSize: 24, fontWeight: "900", color: "#1A1A1A", marginTop: 1 },
  breakdownArea: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  donutChart: { marginLeft: -9 },
  breakdownLegend: { flex: 1, marginLeft: -3, gap: 4 },
  legendRow: { flexDirection: "row", alignItems: "center", minWidth: 0 },
  legendColor: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  legendLabel: { flex: 1, fontSize: 8, color: "#9E9E9E" },
  legendValue: { fontSize: 9, fontWeight: "800", color: "#757575" },
  statSubtitleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  statSubtitle: { flex: 1, fontSize: 10, color: "#A0A0A0" },
});
