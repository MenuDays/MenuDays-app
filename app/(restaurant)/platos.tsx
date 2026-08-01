import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Text, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import FilterChips, { FilterChipOption } from "../components/restaurant/FilterChips";
import EntityListCard from "../components/restaurant/EntityListCard";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import { StatusTone } from "../components/restaurant/StatusBadge";
import DishService, { Dish } from "../../services/dish.service";
import { AppAlert } from "../components/common/AppAlert";

type FilterValue = "todos" | "disponible" | "agotado" | "inactivo";

const FILTERS: FilterChipOption<FilterValue>[] = [
  { value: "todos", label: "Todos", activeColor: "#FB8C00" },
  { value: "disponible", label: "Disponibles", activeColor: "#43A047" },
  { value: "agotado", label: "Agotados", activeColor: "#E53935" },
  { value: "inactivo", label: "Inactivos", activeColor: "#9E9E9E" },
];

function getStatusMeta(dish: Dish): { label: string; tone: StatusTone } {
  if (!dish.activo) return { label: "Inactivo", tone: "neutral" };
  if (dish.estado === "agotado") return { label: "Agotado", tone: "danger" };
  return { label: "Disponible", tone: "success" };
}

export default function DishListScreen() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDishes() {
    try {
      const data = await DishService.getAll();
      setDishes(data);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudieron cargar los platos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadDishes();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadDishes();
  }

  function handleDelete(id: string) {
    AppAlert.alert("Eliminar plato", "¿Seguro que querés eliminar este plato?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await DishService.remove(id);
            setDishes((prev) => prev.filter((d) => d.id !== id));
          } catch (e: any) {
            AppAlert.alert("Error", e.message || "No se pudo eliminar el plato.");
          }
        },
      },
    ]);
  }

  async function handleToggleVisibility(dish: Dish) {
    try {
      const updated = await DishService.update(dish.id, { activo: !dish.activo });
      setDishes((prev) => prev.map((d) => (d.id === dish.id ? { ...d, activo: updated.activo } : d)));
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar el plato.");
    }
  }

  const filteredDishes = dishes.filter((d) => {
    if (filter === "todos") return true;
    if (filter === "inactivo") return !d.activo;
    return d.activo && d.estado === filter;
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Platos"
        rightIcon="add"
        onRightPress={() => router.push("/(restaurant)/platos/form")}
      />
      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredDishes}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay platos en esta categoría.</Text>
          }
          renderItem={({ item }) => {
            const statusMeta = getStatusMeta(item);
            return (
              <EntityListCard
                imageUri={item.plato_imagenes[0]?.url ?? null}
                title={item.nombre}
                subtitle={item.categorias?.nombre}
                highlight={`$${Number(item.precio).toFixed(2)}`}
                statusLabel={statusMeta.label}
                statusTone={statusMeta.tone}
                isHidden={!item.activo}
                onPress={() =>
                  router.push({ pathname: "/(restaurant)/platos/[id]", params: { id: item.id.toString() } })
                }
                onEdit={() => router.push(`/(restaurant)/platos/form?id=${item.id}`)}
                onDelete={() => handleDelete(item.id)}
                onToggleVisibility={() => handleToggleVisibility(item)}
              />
            );
          }}
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
