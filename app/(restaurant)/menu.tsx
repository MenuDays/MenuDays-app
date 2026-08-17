import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MenuService, { Menu, MenuStatus } from "../../services/menu.service";
import MenuCollectionService, { MenuCollection } from "../../services/menu-collection.service";
import { AppAlert } from "../components/common/AppAlert";
import EntityListCard from "../components/restaurant/EntityListCard";
import FilterChips, { FilterChipOption } from "../components/restaurant/FilterChips";
import PublishFab from "../components/restaurant/PublishFab";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import { StatusTone } from "../components/restaurant/StatusBadge";

type FilterValue = "todos" | MenuStatus;

const FILTERS: FilterChipOption<FilterValue>[] = [
  { value: "todos", label: "Todos", activeColor: "#FB8C00" },
  { value: "programado", label: "Programados", activeColor: "#1E88E5" },
  { value: "publicado", label: "Publicados", activeColor: "#43A047" },
  { value: "agotado", label: "Agotados", activeColor: "#E53935" },
  { value: "oculto", label: "Ocultos", activeColor: "#9E9E9E" },
];

const STATUS_META: Record<MenuStatus, { label: string; tone: StatusTone }> = {
  programado: { label: "Programado", tone: "info" },
  publicado: { label: "Publicado", tone: "success" },
  oculto: { label: "Oculto", tone: "neutral" },
  agotado: { label: "Agotado", tone: "danger" },
};

// Id sintético (nunca choca con un id real de BigInt) para el grupo
// fallback de menús sin colección -- ver punto 8/19 del plan: "Sin
// colección" es solo un bucket visual, no una colección editable.
const SIN_COLECCION_ID = "sin-coleccion";

interface CollectionGroup {
  id: string;
  nombre: string;
  menus: Menu[];
  // false para "Sin colección" -- no tiene botón "+" ni es editable.
  isRealCollection: boolean;
}

export default function MenuListScreen() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [collections, setCollections] = useState<MenuCollection[]>([]);
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);

  async function loadMenus() {
    try {
      const data = await MenuService.getAll();
      setMenus(data);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudieron cargar los menús.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadCollections() {
    try {
      const data = await MenuCollectionService.getAll();
      setCollections(data);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudieron cargar las colecciones.");
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadMenus();
      loadCollections();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadMenus();
    loadCollections();
  }

  function handleDelete(id: string) {
    AppAlert.alert("Eliminar menú", "¿Seguro que quieres eliminar este menú?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await MenuService.remove(id);
            setMenus((prev) => prev.filter((m) => m.id !== id));
          } catch (e: any) {
            AppAlert.alert("Error", e.message || "No se pudo eliminar el menú.");
          }
        },
      },
    ]);
  }

  async function handleToggleVisibility(menu: Menu) {
    try {
      const result = await MenuService.toggle(menu.id);
      setMenus((prev) =>
        prev.map((m) => (m.id === menu.id ? { ...m, estado: result.estado } : m))
      );
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar el menú.");
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreateModal() {
    setNewCollectionName("");
    setCreateModalVisible(true);
  }

  async function handleCreateCollection() {
    const nombre = newCollectionName.trim();
    if (!nombre) {
      AppAlert.alert("Falta el nombre", "Ingresa un nombre para la colección.");
      return;
    }
    if (nombre.length > 100) {
      AppAlert.alert("Nombre muy largo", "El nombre no puede superar los 100 caracteres.");
      return;
    }
    setCreatingCollection(true);
    try {
      const created = await MenuCollectionService.create(nombre);
      setCreateModalVisible(false);
      // Refetch en vez de insertar local: mantiene orden/_count siempre
      // fiel a lo que realmente quedó guardado en el backend.
      await loadCollections();
      setExpandedIds((prev) => new Set(prev).add(created.id));
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo crear la colección.");
    } finally {
      setCreatingCollection(false);
    }
  }

  const filteredMenus =
    filter === "todos" ? menus : menus.filter((m) => m.estado === filter);

  // Colecciones ordenadas (incluye las vacías -- deben verse igual con su
  // botón "+"), más el bucket "Sin colección" al final solo si aplica.
  const groups = useMemo<CollectionGroup[]>(() => {
    const orderedCollections = [...collections].sort((a, b) => a.orden - b.orden);
    const realGroups: CollectionGroup[] = orderedCollections.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      menus: filteredMenus.filter((m) => m.coleccion_id === c.id),
      isRealCollection: true,
    }));

    const sinColeccion = filteredMenus.filter((m) => m.coleccion_id === null);
    if (sinColeccion.length > 0) {
      realGroups.push({
        id: SIN_COLECCION_ID,
        nombre: "Sin colección",
        menus: sinColeccion,
        isRealCollection: false,
      });
    }

    return realGroups;
  }, [collections, filteredMenus]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Menú del día" showBack />
      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={styles.loader} />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
          }
        >
          {groups.length === 0 ? (
            <Text style={styles.emptyText}>No hay menús en esta categoría.</Text>
          ) : (
            groups.map((group) => (
              <CollectionSection
                key={group.id}
                title={group.nombre}
                count={group.menus.length}
                expanded={expandedIds.has(group.id)}
                onToggleExpand={() => toggleExpanded(group.id)}
                onAddPress={
                  group.isRealCollection
                    ? () =>
                        router.push({
                          pathname: "/(restaurant)/menu/form",
                          params: { coleccionId: group.id },
                        })
                    : undefined
                }
              >
                {group.menus.map((item) => (
                  <EntityListCard
                    key={item.id}
                    imageUri={item.foto_url}
                    title={item.nombre}
                    subtitle={item.descripcion ?? undefined}
                    highlight={`$${Number(item.precio).toFixed(2)}`}
                    statusLabel={STATUS_META[item.estado].label}
                    statusTone={STATUS_META[item.estado].tone}
                    isHidden={item.estado === "oculto"}
                    onPress={() => router.push({ pathname: "/(restaurant)/menu/[id]", params: { id: item.id.toString() } })}
                    onEdit={() => router.push(`/(restaurant)/menu/form?id=${item.id}`)}
                    onDelete={() => handleDelete(item.id)}
                    onToggleVisibility={() => handleToggleVisibility(item)}
                  />
                ))}
              </CollectionSection>
            ))
          )}

          <TouchableOpacity style={styles.addCollectionButton} activeOpacity={0.85} onPress={openCreateModal}>
            <Ionicons name="add-circle-outline" size={20} color="#FB8C00" />
            <Text style={styles.addCollectionText}>Añadir colección</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <PublishFab label="Publicar menú" onPress={() => router.push("/(restaurant)/menu/form")} />
      <RestaurantBottomNav />

      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva colección</Text>
            <Text style={styles.modalLabel}>Nombre</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Especialidades de la casa"
              placeholderTextColor="#B0B0B0"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              maxLength={100}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setCreateModalVisible(false)}
                disabled={creatingCollection}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={handleCreateCollection}
                disabled={creatingCollection}
              >
                <Text style={styles.modalCreateText}>
                  {creatingCollection ? "Creando..." : "Crear"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================================================
// Subcomponente: sección/acordeón de una colección. Header con
// chevron+nombre+contador (toca para expandir/contraer) y, si es una
// colección real (no "Sin colección"), un botón "+" separado que abre el
// mismo formulario de creación de menú ya usado en toda la pantalla, con
// la colección preseleccionada por query param.
// ==========================================================================

function CollectionSection({
  title,
  count,
  expanded,
  onToggleExpand,
  onAddPress,
  children,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onAddPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={styles.sectionHeaderLeft}
          activeOpacity={0.7}
          onPress={onToggleExpand}
        >
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-forward"}
            size={18}
            color="#B0793A"
          />
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {title}
          </Text>
          {count > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>

        {onAddPress ? (
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={onAddPress}
            hitSlop={8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {expanded && (
        <View style={styles.sectionBody}>
          {count === 0 ? (
            <Text style={styles.emptySectionText}>Todavía no hay menús acá.</Text>
          ) : (
            children
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loader: {
    marginTop: 40,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 14,
    marginTop: 40,
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  sectionHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  countBadge: {
    backgroundColor: "#FFF1DC",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#B0793A",
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFA726",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  emptySectionText: {
    fontSize: 12.5,
    color: "#B0B0B0",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  addCollectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#FFD8A8",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  addCollectionText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FB8C00",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 15, 10, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3E2723",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#3E2723",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F5F5F5",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#757575",
  },
  modalCreateButton: {
    backgroundColor: "#FB8C00",
  },
  modalCreateText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
