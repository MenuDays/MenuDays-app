import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RankingRow } from "./types";
import { RANK_COLORS } from "./chartConfig";
import { AppAlert } from "../common/AppAlert";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface RankingCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  columnLabel: string;
  linkText: string;
  data: RankingRow[];
  /** Mensaje mostrado cuando `data` viene vacío (se leyó la BD real y no hay filas todavía). */
  emptyLabel: string;
  onPressRow?: (id?: number) => void;
  onPressLink?: () => void;
}

export default function RankingCard({
  title,
  subtitle,
  icon,
  color,
  columnLabel,
  linkText,
  data,
  emptyLabel,
  onPressRow,
  onPressLink,
}: RankingCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function handlePressRow(id?: number) {
    if (onPressRow) {
      onPressRow(id);
      return;
    }
    AppAlert.alert("Próximamente", "El detalle de este restaurante estará disponible pronto.");
  }

  function handlePressLink() {
    if (onPressLink) {
      onPressLink();
      return;
    }
    AppAlert.alert("Próximamente", `${linkText} estará disponible pronto.`);
  }

  return (
    <View style={styles.rankingCard}>
      <View style={[styles.rankingHeader, { backgroundColor: color }]}>
        <View style={styles.rankingHeaderIcon}>
          <Ionicons name={icon} size={17} color="#FFFFFF" />
        </View>

        <View style={styles.rankingHeaderTextBlock}>
          <Text style={styles.rankingHeaderText}>{title}</Text>
          <Text style={styles.rankingHeaderSubtitle}>{subtitle}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
      </View>

      <View style={styles.rankingBody}>
        {data.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="file-tray-outline" size={22} color={colors.placeholder} />
            <Text style={styles.emptyText}>{emptyLabel}</Text>
          </View>
        ) : (
          <>
        <View style={styles.rankingTableHeader}>
          <Text style={styles.rankingTableHeaderCol}>POS.</Text>
          <Text style={[styles.rankingTableHeaderCol, styles.rankingNameCol]}>
            RESTAURANTE
          </Text>
          <Text style={styles.rankingTableHeaderCol}>{columnLabel.toUpperCase()}</Text>
        </View>

        {data.map((row) => {
          const isTopThree = row.position <= 3;

          return (
            <TouchableOpacity
              key={row.position}
              activeOpacity={0.75}
              style={[styles.rankingRow, isTopThree && styles.rankingRowHighlight]}
              onPress={() => handlePressRow(row.id)}
            >
              <View style={styles.rankingPositionCell}>
                <View
                  style={[
                    styles.rankingBadge,
                    { backgroundColor: RANK_COLORS[(row.position - 1) % RANK_COLORS.length] },
                    row.position === 1 && styles.firstPlaceBadge,
                  ]}
                >
                  {row.position <= 3 ? (
                    <Ionicons name="restaurant" size={11} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.rankingBadgeNumber}>{row.position}</Text>
                  )}
                </View>

                <Text style={[styles.rankingPositionText, row.position === 1 && styles.firstPlaceText]}>
                  {row.position}
                </Text>
              </View>

              <View style={styles.rankingNameWrap}>
                <Text
                  style={[styles.rankingName, row.position === 1 && styles.firstPlaceText]}
                  numberOfLines={1}
                >
                  {row.name}
                </Text>

                {row.position === 1 && (
                  <View style={styles.topBadge}>
                    <Text style={styles.topBadgeText}>TOP</Text>
                  </View>
                )}
              </View>

              <View style={styles.rankingValueWrap}>
                <Text style={styles.rankingValue}>{row.value}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.placeholder} />
              </View>
            </TouchableOpacity>
          );
        })}
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.rankingLinkButton, { borderColor: color }]}
          onPress={handlePressLink}
        >
          <Text style={[styles.rankingLink, { color }]}>{linkText}</Text>
          <Ionicons name="arrow-forward" size={15} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  rankingCard: {
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: colors.card,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  rankingHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 14 },
  rankingHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankingHeaderTextBlock: { flex: 1 },
  rankingHeaderText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  rankingHeaderSubtitle: { fontSize: 10, color: "rgba(255,255,255,0.78)", marginTop: 2 },
  rankingBody: { padding: 15 },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 26, gap: 8 },
  emptyText: { fontSize: 12.5, color: colors.textSecondary, textAlign: "center" },
  rankingTableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 5, marginBottom: 7 },
  rankingTableHeaderCol: { fontSize: 8, fontWeight: "800", letterSpacing: 0.7, color: colors.textSecondary, width: 58 },
  rankingNameCol: { flex: 1, width: undefined },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rankingRowHighlight: { backgroundColor: colors.surfaceSecondary },
  rankingPositionCell: { flexDirection: "row", alignItems: "center", gap: 7, width: 58 },
  rankingBadge: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  firstPlaceBadge: { width: 28, height: 28, borderRadius: 9 },
  rankingBadgeNumber: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  rankingPositionText: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  firstPlaceText: { fontWeight: "900", color: colors.text },
  rankingNameWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7, minWidth: 0 },
  rankingName: { flexShrink: 1, fontSize: 12, color: colors.text, fontWeight: "600" },
  topBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: "#FFF1C9" },
  topBadgeText: { fontSize: 7, fontWeight: "900", color: "#C98600" },
  rankingValueWrap: { width: 68, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  rankingValue: { fontSize: 13, fontWeight: "900", color: colors.text },
  rankingLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  rankingLink: { fontSize: 11, fontWeight: "800" },
});