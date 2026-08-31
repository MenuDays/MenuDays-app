import React, { useMemo } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { getChartConfig } from "./chartConfig";
import { StatCardData } from "./types";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface StatCardProps {
  stat: StatCardData;
  opacity: Animated.Value;
  translateY: Animated.Value;
  onPress?: () => void;
}

export default function StatCard({ stat, opacity, translateY, onPress }: StatCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const chartConfig = useMemo(() => getChartConfig(colors), [colors]);

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
            <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
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
                legendFontColor: colors.textSecondary,
                legendFontSize: 10,
              }))}
              width={100}
              height={54}
              chartConfig={chartConfig}
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
            <Ionicons name="information-circle-outline" size={13} color={colors.placeholder} />
            <Text style={styles.statSubtitle} numberOfLines={1}>{stat.subtitle}</Text>
          </View>
        ) : null}
      </Wrapper>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  // % en vez de un ancho en px calculado sobre un "ancho de celular"
  // capado a mano -- así siempre entran 2 por fila, en celular Y en
  // tablet.
  statCardWrap: {
    width: "48%",
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    shadowColor: colors.shadow,
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
  statTitle: { fontSize: 11.5, fontWeight: "700", color: colors.textSecondary, marginTop: 10 },
  statValue: { fontSize: 24, fontWeight: "900", color: colors.text, marginTop: 1 },
  breakdownArea: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  donutChart: { marginLeft: -9 },
  breakdownLegend: { flex: 1, marginLeft: -3, gap: 4 },
  legendRow: { flexDirection: "row", alignItems: "center", minWidth: 0 },
  legendColor: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  legendLabel: { flex: 1, fontSize: 8, color: colors.textSecondary },
  legendValue: { fontSize: 9, fontWeight: "800", color: colors.textSecondary },
  statSubtitleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  statSubtitle: { flex: 1, fontSize: 10, color: colors.placeholder },
});
