import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

export default function ProfileCard({
  title,
  children,
  headerRight,
}: {
  title?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {title && (
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {headerRight}
        </View>
      )}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.shadow },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
