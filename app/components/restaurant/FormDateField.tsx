import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FormDateFieldProps {
  label: string;
  value: string; // AAAA-MM-DD
  onChangeText: (value: string) => void;
}

// Va formateando lo que escribe el usuario como AAAA-MM-DD a medida
// que tipea, sin pedirle instalar ningún date picker nativo nuevo.
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  let result = year;
  if (month) result += `-${month}`;
  if (day) result += `-${day}`;
  return result;
}

export default function FormDateField({ label, value, onChangeText }: FormDateFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="calendar-outline" size={18} color="#FFA726" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor="#9E9E9E"
          value={value}
          onChangeText={(text) => onChangeText(formatDateInput(text))}
          keyboardType="number-pad"
          maxLength={10}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3E2723",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#3E2723",
  },
});
