import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Category } from "../../../services/category.service";
import { getCategoryIcon } from "../../../constants/categoryIcons";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface FormCategoryPickerProps {
  label: string;
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
  loading?: boolean;
  // Se llama al tocar "Añadir más categorías". Si NO se pasa, el picker
  // navega solo a la pantalla de categorías (sirve para forms de
  // pantalla completa). Cuando el form vive dentro de un <Modal> (ej. el
  // "nuevo menú" rápido de menu.tsx), el padre TIENE que cerrar su Modal
  // antes de navegar -- un Modal de RN queda siempre por encima de la
  // pantalla nueva -- así que ahí se pasa este callback.
  onAddMoreCategories?: () => void;
}

export default function FormCategoryPicker({
  label,
  categories,
  value,
  onChange,
  loading = false,
  onAddMoreCategories,
}: FormCategoryPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
          {loading
            ? "Cargando categorías..."
            : selected
            ? selected.nombre
            : "Elige una de tus categorías"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.placeholder} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Elige una de tus categorías</Text>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Todavía no elegiste las categorías de tu restaurante.
                </Text>
              }
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addMoreRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setVisible(false);
                    if (onAddMoreCategories) {
                      onAddMoreCategories();
                    } else {
                      router.push("/(restaurant)/elegir-categorias?from=form");
                    }
                  }}
                >
                  <View style={styles.addMoreIcon}>
                    <Ionicons name="add" size={18} color="#FB8C00" />
                  </View>
                  <Text style={styles.addMoreText}>Añadir más categorías</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                </TouchableOpacity>
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
                    {getCategoryIcon(item.nombre) ? (
                      <Image source={getCategoryIcon(item.nombre)!} style={styles.optionIcon} />
                    ) : item.iconos?.url ? (
                      <Image source={{ uri: item.iconos.url }} style={styles.optionIcon} />
                    ) : (
                      <View style={[styles.optionIcon, styles.optionIconPlaceholder]}>
                        <Ionicons name="restaurant-outline" size={16} color={colors.placeholder} />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.inputBackground,
  },
  icon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  placeholder: {
    color: colors.placeholder,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
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
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
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
    backgroundColor: colors.surfaceSecondary,
  },
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  optionIconPlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "600",
    color: colors.text,
  },
  optionTextSelected: {
    color: "#B87A00",
    fontWeight: "800",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
    paddingVertical: 24,
  },
  addMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  addMoreIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#B87A00",
  },
});
