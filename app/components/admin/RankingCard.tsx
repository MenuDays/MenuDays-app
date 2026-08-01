import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RankingRow } from "./types";
import { RANK_COLORS } from "./chartConfig";
import { AppAlert } from "../common/AppAlert";

interface RankingCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  columnLabel: string;
  linkText: string;
  data: RankingRow[];
}

export default function RankingCard({
  title,
  subtitle,
  icon,
  color,
  columnLabel,
  linkText,
  data,
}: RankingCardProps) {
  function handlePressRow() {
    AppAlert.alert("Próximamente", "El detalle de este restaurante estará disponible pronto.");
  }

  function handlePressLink() {
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
              onPress={handlePressRow}
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
                <Ionicons name="chevron-forward" size={14} color="#BDBDBD" />
              </View>
            </TouchableOpacity>
          );
        })}

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

const styles = StyleSheet.create({
  rankingCard: {
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
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
  rankingTableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 5, marginBottom: 7 },
  rankingTableHeaderCol: { fontSize: 8, fontWeight: "800", letterSpacing: 0.7, color: "#B0B0B0", width: 58 },
  rankingNameCol: { flex: 1, width: undefined },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
  },
  rankingRowHighlight: { backgroundColor: "#FFFCF5" },
  rankingPositionCell: { flexDirection: "row", alignItems: "center", gap: 7, width: 58 },
  rankingBadge: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  firstPlaceBadge: { width: 28, height: 28, borderRadius: 9 },
  rankingBadgeNumber: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  rankingPositionText: { fontSize: 11, color: "#757575", fontWeight: "600" },
  firstPlaceText: { fontWeight: "900", color: "#1A1A1A" },
  rankingNameWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7, minWidth: 0 },
  rankingName: { flexShrink: 1, fontSize: 12, color: "#1A1A1A", fontWeight: "600" },
  topBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: "#FFF1C9" },
  topBadgeText: { fontSize: 7, fontWeight: "900", color: "#C98600" },
  rankingValueWrap: { width: 68, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  rankingValue: { fontSize: 13, fontWeight: "900", color: "#1A1A1A" },
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