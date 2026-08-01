import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";

interface FormToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function FormToggleRow({
  label,
  value,
  onValueChange,
}: FormToggleRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: "#D9D9D9",
          true: "#FFD180",
        }}
        thumbColor={value ? "#FB8C00" : "#FFFFFF"}
        ios_backgroundColor="#D9D9D9"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#FFFFFF",
    borderRadius: 14,

    paddingHorizontal: 16,
    paddingVertical: 14,

    marginBottom: 14,

    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  label: {
    flex: 1,

    fontSize: 15,
    fontWeight: "600",
    color: "#212121",

    marginRight: 16,
  },
});