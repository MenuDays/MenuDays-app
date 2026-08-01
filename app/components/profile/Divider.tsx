import React from "react";
import { View, StyleSheet } from "react-native";

export default function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
  },
});