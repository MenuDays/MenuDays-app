import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChangePage: (page: number) => void;
}

const MAX_VISIBLE_PAGES = 3; // sacar este límite cuando se defina paginación real

export default function Pagination({
  page,
  totalPages,
  onChangePage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = Math.min(totalPages, MAX_VISIBLE_PAGES);
  const pages = Array.from({ length: visiblePages }, (_, i) => i + 1);

  return (
    <View style={styles.row}>
      {pages.map((p) => {
        const isActive = p === page;
        return (
          <TouchableOpacity
            key={p}
            style={[styles.dot, isActive && styles.dotActive]}
            onPress={() => onChangePage(p)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={[styles.dotText, isActive && styles.dotTextActive]}>
              {p}
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
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: "#FB8C00",
  },
  dotText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9E9E9E",
  },
  dotTextActive: {
    color: "#FFFFFF",
  },
});