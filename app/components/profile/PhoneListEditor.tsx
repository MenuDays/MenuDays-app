import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantPhone } from "../../../services/restaurant.service";
import { useTheme } from "../../../contexts/ThemeContext";

export default function PhoneListEditor({
  phones,
  onAdd,
  onRemove,
}: {
  phones: RestaurantPhone[];
  onAdd: (telefono: string) => void;
  onRemove: (id: number) => void;
}) {
  const { colors } = useTheme();
  const [newPhone, setNewPhone] = useState("");

  function handleAdd() {
    const trimmed = newPhone.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewPhone("");
  }

  return (
    <View>
      {phones.map((phone) => (
        <View key={phone.id} style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Ionicons name="call-outline" size={18} color={colors.primary} style={styles.icon} />
          <Text style={[styles.value, { color: colors.text }]}>{phone.telefono}</Text>
          <TouchableOpacity onPress={() => onRemove(phone.id)} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.border} />
          </TouchableOpacity>
        </View>
      ))}

      {phones.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.placeholder }]}>
          Todavía no agregaste ningún teléfono
        </Text>
      )}

      <View style={styles.addRow}>
        <TextInput
          style={[
            styles.addInput,
            { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground },
          ]}
          value={newPhone}
          onChangeText={setNewPhone}
          placeholder="+593 99 123 4567"
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          disabled={!newPhone.trim()}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  value: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    paddingVertical: 12,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  addInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
