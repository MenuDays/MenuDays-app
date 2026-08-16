import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "../../../services/category.service";

interface FormCategoryPickerProps {
  label: string;
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
  loading?: boolean;
}

export default function FormCategoryPicker({
  label,
  categories,
  value,
  onChange,
  loading = false,
}: FormCategoryPickerProps) {
  const [visible, setVisible] = useState(false);
  const selected = categories.find((c) => c.id === value) ?? null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.inputContainer}
        activeOpacity={0.85}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="pricetags-outline" size={18} color="#FFA726" style={styles.icon} />
        <Text style={[styles.inputText, !selected && styles.placeholder]} numberOfLines={1}>
          {loading ? "Cargando categorías..." : selected ? selected.nombre : "Elige una categoría"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#9E9E9E" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Elige una categoría</Text>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay categorías disponibles.</Text>
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
                    {item.iconos?.url ? (
                      <Image source={{ uri: item.iconos.url }} style={styles.optionIcon} />
                    ) : (
                      <View style={[styles.optionIcon, styles.optionIconPlaceholder]}>
                        <Ionicons name="restaurant-outline" size={16} color="#C9C9C9" />
                      </View>
                    )}
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
  },
  optionIconPlaceholder: {
    backgroundColor: "#F5F5F5",
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
