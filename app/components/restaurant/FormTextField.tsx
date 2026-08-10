import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface FormTextFieldProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  // multiline = textarea con contador de caracteres (ej. descripción,
  // igual a como se ve "0/200" en la referencia)
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  // false = mismo look de caja con borde, pero de solo lectura -- para
  // reusar este componente tanto en modo vista como en modo edición
  // (ej. en el perfil del restaurante).
  editable?: boolean;
}

export default function FormTextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline = false,
  maxLength,
  keyboardType = "default",
  editable = true,
}: FormTextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      {multiline ? (
        <View style={[styles.textareaContainer, !editable && styles.containerReadOnly]}>
          <TextInput
            style={styles.textarea}
            placeholder={placeholder}
            placeholderTextColor="#9E9E9E"
            value={value}
            onChangeText={(text) =>
              onChangeText?.(maxLength ? text.slice(0, maxLength) : text)
            }
            multiline
            maxLength={maxLength}
            textAlignVertical="top"
            editable={editable}
          />
          {maxLength && editable ? (
            <Text style={styles.charCount}>
              {value.length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.inputContainer, !editable && styles.containerReadOnly]}>
          {icon ? (
            <Ionicons name={icon} size={18} color="#FFA726" style={styles.icon} />
          ) : null}
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9E9E9E"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            editable={editable}
          />
        </View>
      )}
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
  containerReadOnly: {
    backgroundColor: "#FAFAFA",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#3E2723",
  },
  textareaContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  textarea: {
  fontSize: 14,
  color: "#3E2723",
  minHeight: 80,
  textAlignVertical: "top",
  paddingTop: 0,
  paddingBottom: 0,
  includeFontPadding: false,
},
  charCount: {
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "right",
    marginTop: 4,
  },
});