import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Text, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import FilterChips, { FilterChipOption } from "../components/restaurant/FilterChips";
import EntityListCard from "../components/restaurant/EntityListCard";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import { StatusTone } from "../components/restaurant/StatusBadge";
import MenuService, { Menu, MenuStatus } from "../../services/menu.service";
import { AppAlert } from "../components/common/AppAlert";

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

export default function MenuListScreen() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadMenus();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadMenus();
  }

  function handleDelete(id: string) {
    AppAlert.alert("Eliminar menú", "¿Seguro que querés eliminar este menú?", [
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

  const filteredMenus =
    filter === "todos" ? menus : menus.filter((m) => m.estado === filter);

  return (
    <View style={styles.container}>
    
        <ScreenHeader
          title="Menú del día"
          rightIcon="add"
          onRightPress={() => router.push("/(restaurant)/menu/form")}
        />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredMenus}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay menús en esta categoría.</Text>
          }
          renderItem={({ item }) => (
            <EntityListCard
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
              // Sin onToggleVisibility: todavía no hay endpoint en el
              // back para cambiar el estado de un menú manualmente.
            />
          )}
        />
      )}

      <RestaurantBottomNav />
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
});