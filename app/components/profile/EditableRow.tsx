import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EditableRow({
  icon,
  label,
  value,
  onChangeText,
  autoFocus,
  keyboardType,
  autoCapitalize,
  multiline,
  placeholder,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "url";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={[styles.infoRow, multiline && styles.infoRowMultiline]}>
      <Ionicons
        name={icon as any}
        size={18}
        color="#F5A800"
        style={styles.infoIcon}
      />
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={[styles.infoInput, multiline && styles.infoInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#BDBDBD"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoRowMultiline: {
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: "#757575",
    width: 90,
  },
  infoInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "right",
    paddingVertical: 0,
  },
  infoInputMultiline: {
    textAlign: "left",
    minHeight: 60,
  },
});