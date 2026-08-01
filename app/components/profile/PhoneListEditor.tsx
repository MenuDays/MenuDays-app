import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantPhone } from "../../../services/restaurant.service";

export default function PhoneListEditor({
  phones,
  onAdd,
  onRemove,
}: {
  phones: RestaurantPhone[];
  onAdd: (telefono: string) => void;
  onRemove: (id: number) => void;
}) {
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
        <View key={phone.id} style={styles.row}>
          <Ionicons name="call-outline" size={18} color="#F5A800" style={styles.icon} />
          <Text style={styles.value}>{phone.telefono}</Text>
          <TouchableOpacity onPress={() => onRemove(phone.id)} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#E0E0E0" />
          </TouchableOpacity>
        </View>
      ))}

      {phones.length === 0 && (
        <Text style={styles.emptyText}>Todavía no agregaste ningún teléfono</Text>
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={newPhone}
          onChangeText={setNewPhone}
          placeholder="+593 99 123 4567"
          placeholderTextColor="#BDBDBD"
          keyboardType="phone-pad"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={!newPhone.trim()}>
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
    borderBottomColor: "#F5F5F5",
  },
  icon: {
    marginRight: 10,
  },
  value: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  emptyText: {
    fontSize: 13,
    color: "#9E9E9E",
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
    borderColor: "#E7E7E7",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F5A800",
    alignItems: "center",
    justifyContent: "center",
  },
});