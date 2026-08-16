import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

export default function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
  },
});
