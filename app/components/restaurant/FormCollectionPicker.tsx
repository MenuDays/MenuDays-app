import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MenuCollection } from "../../../services/menu-collection.service";

// Mismo patrón visual que FormCategoryPicker (bottom sheet con lista +
// checkmark), pero con datos de menu_colecciones -- un concepto
// independiente de las categorías de plato, así que NO reutiliza
// CategoryService ni FormCategoryPicker.
interface FormCollectionPickerProps {
  collections: MenuCollection[];
  value: string | null;
  onChange: (collectionId: string) => void;
  loading?: boolean;
}

export default function FormCollectionPicker({
  collections,
  value,
  onChange,
  loading = false,
}: FormCollectionPickerProps) {
  const [visible, setVisible] = useState(false);
  const selected = collections.find((c) => c.id === value) ?? null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Colección (opcional)</Text>

      <TouchableOpacity
        style={styles.inputContainer}
        activeOpacity={0.85}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="albums-outline" size={18} color="#FFA726" style={styles.icon} />
        <Text style={[styles.inputText, !selected && styles.placeholder]} numberOfLines={1}>
          {loading ? "Cargando colecciones..." : selected ? selected.nombre : "Sin colección"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#9E9E9E" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Elige una colección</Text>

            <FlatList
              data={collections}
              keyExtractor={(item) => item.id}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Todavía no creaste ninguna colección.</Text>
              }
              renderItem={({ item }) => {
                const isSelected = item.id === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onChange(item.id);
                      setVisible(false);
                    }}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="albums-outline" size={16} color="#B0793A" />
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.nombre}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#FB8C00" />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  inputText: {
    flex: 1,
    fontSize: 14,
    color: "#3E2723",
  },
  placeholder: {
    color: "#9E9E9E",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 15, 10, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  optionSelected: {
    backgroundColor: "#FFF6E2",
  },
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF1DC",
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "600",
    color: "#3E2723",
  },
  optionTextSelected: {
    color: "#B87A00",
    fontWeight: "800",
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 13,
    paddingVertical: 24,
  },
});
