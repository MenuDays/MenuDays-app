import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CategoryService, { Category } from "../../services/category.service";
import { AppAlert } from "../components/common/AppAlert";
import { Toast } from "../components/common/Toast";
import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";
import { getCategoryIcon } from "../../constants/categoryIcons";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

export default function ChooseCategoriesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Si venimos de "Mi perfil" para editar (from=perfil), al guardar
  // volvemos ahí y mostramos el botón de volver. Si venimos del login
  // (primera vez, todavía sin categorías elegidas), no hay a dónde
  // volver: se oculta el back y al guardar se entra al dashboard.
  const { from } = useLocalSearchParams<{ from?: string }>();
  // Cualquier `from` (perfil, form, ...) = venimos de otra pantalla dentro
  // de la app: mostramos el "atrás" y al guardar volvemos. Sin `from` es
  // el flujo de primera vez (login / recién aprobado), que encadena a
  // "Configurar delivery".
  const cameFromProfile = !!from;
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const all = await CategoryService.getAll();
        setCategories(all);

        // Si el restaurante ya tenía categorías elegidas (ej. venimos a
        // editar desde "Mi perfil"), las precargamos seleccionadas.
        try {
          const current = await CategoryService.getRestaurantCategories();
          setSelectedIds(new Set(current));
        } catch {
          // sin preselección
        }
      } catch (e: any) {
        AppAlert.alert("Error", e.message || "No se pudieron cargar las categorías.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((c) => c.nombre.toLowerCase().includes(query));
  }, [categories, search]);

  function toggleCategory(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === categories.length ? new Set() : new Set(categories.map((c) => c.id))
    );
  }

  async function handleSave() {
    if (selectedIds.size === 0) {
      AppAlert.alert("Elige al menos una categoría", "Selecciona las categorías que ofrece tu restaurante.");
      return;
    }
    setSaving(true);
    try {
      await CategoryService.updateRestaurantCategories(Array.from(selectedIds));
      Toast.success("Categorías guardadas");
      if (cameFromProfile) {
        router.back();
      } else {
        // Primera vez (recién aprobado / recién logueado sin categorías):
        // encadena a "Configurar delivery" antes de entrar al dashboard.
        router.replace("/(restaurant)/configurar-delivery");
      }
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudieron guardar las categorías.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingScreen>
        <View style={styles.header}>
          {cameFromProfile ? (
            <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 26 }} />
          )}
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Elegir categorías</Text>
            <Text style={styles.headerSubtitle}>Selecciona las categorías que ofrece tu restaurante</Text>
          </View>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar categoría..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Seleccionadas: <Text style={styles.countHighlight}>{selectedIds.size} categorías</Text>
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {selectedIds.size} / {categories.length}
            </Text>
          </View>
        </View>

        {!loading && categories.length > 0 && (
          <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll} activeOpacity={0.85}>
            <Ionicons
              name={selectedIds.size === categories.length ? "close-circle-outline" : "checkmark-done-outline"}
              size={16}
              color="#FFA726"
            />
            <Text style={styles.selectAllText}>
              {selectedIds.size === categories.length ? "Deseleccionar todo" : "Seleccionar todo"}
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#FB8C00" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No encontramos categorías con ese nombre.</Text>
            }
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <TouchableOpacity
                  style={[styles.card, isSelected && styles.cardSelected]}
                  activeOpacity={0.85}
                  onPress={() => toggleCategory(item.id)}
                >
                  <View style={styles.imageWrap}>
                    {getCategoryIcon(item.nombre) ? (
                      <Image source={getCategoryIcon(item.nombre)!} style={styles.image} />
                    ) : item.iconos?.url ? (
                      <Image source={{ uri: item.iconos.url }} style={styles.image} />
                    ) : (
                      <View style={[styles.image, styles.imagePlaceholder]}>
                        <Ionicons name="restaurant-outline" size={22} color={colors.placeholder} />
                      </View>
                    )}
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                    </View>
                  </View>
                  <Text style={styles.cardLabel} numberOfLines={2}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>
              {saving ? "Guardando..." : "Guardar categorías seleccionadas"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingScreen>
    </SafeAreaView>
  );
}

const CARD_GAP = 10;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTextWrap: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
  },
  countText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  countHighlight: {
    color: "#FFA726",
    fontWeight: "800",
  },
  countBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    color: "#FFA726",
    fontSize: 12,
    fontWeight: "700",
  },
  loader: {
    marginTop: 40,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selectAllText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFA726",
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  cardSelected: {
    borderColor: "#FFA726",
    backgroundColor: colors.surfaceSecondary,
  },
  imageWrap: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleSelected: {
    borderColor: "#FFA726",
    backgroundColor: "#FFA726",
  },
  cardLabel: {
    fontSize: 11.5,
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 40,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  saveButton: {
    backgroundColor: "#FB8C00",
    borderRadius: 28,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});