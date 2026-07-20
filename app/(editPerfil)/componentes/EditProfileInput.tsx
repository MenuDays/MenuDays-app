import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    KeyboardTypeOptions,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface EditProfileInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
}

export default function EditProfileInput({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  editable = true,
}: EditProfileInputProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name={icon}
        size={20}
        color="#F5A800"
        style={styles.icon}
      />

      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BDBDBD"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  icon: {
    marginRight: 14,
  },

  content: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: "#9E9E9E",
    marginBottom: 4,
    fontWeight: "600",
  },

  input: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "600",
    padding: 0,
  },
});