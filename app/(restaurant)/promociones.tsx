import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import PromotionService, { Promotion } from "../../services/promotion.service";
import { AppAlert } from "../components/common/AppAlert";
import EntityListCard from "../components/restaurant/EntityListCard";
import FilterChips, { FilterChipOption } from "../components/restaurant/FilterChips";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import { StatusTone } from "../components/restaurant/StatusBadge";

type FilterValue = "todos" | "vigente" | "programada" | "vencida" | "inactiva";

const FILTERS: FilterChipOption<FilterValue>[] = [
  { value: "todos", label: "Todas", activeColor: "#FB8C00" },
  { value: "vigente", label: "Vigentes", activeColor: "#43A047" },
  { value: "programada", label: "Programadas", activeColor: "#1E88E5" },
  { value: "vencida", label: "Vencidas", activeColor: "#E53935" },
  { value: "inactiva", label: "Inactivas", activeColor: "#9E9E9E" },
];

function getPromotionState(promotion: Promotion): Exclude<FilterValue, "todos"> {
  if (!promotion.activa) return "inactiva";
  const today = new Date().toISOString().slice(0, 10);
  const start = promotion.fecha_inicio.slice(0, 10);
  const end = promotion.fecha_fin.slice(0, 10);
  if (today < start) return "programada";
  if (today > end) return "vencida";
  return "vigente";
}

function getStatusMeta(promotion: Promotion): { label: string; tone: StatusTone } {
  const state = getPromotionState(promotion);
  switch (state) {
    case "vigente":
      return { label: "Vigente", tone: "success" };
    case "programada":
      return { label: "Programada", tone: "info" };
    case "vencida":
      return { label: "Vencida", tone: "danger" };
    default:
      return { label: "Inactiva", tone: "neutral" };
  }
}

function formatRange(promotion: Promotion): string {
  const start = promotion.fecha_inicio.slice(0, 10);
  const end = promotion.fecha_fin.slice(0, 10);
  return `${start} al ${end}`;
}

export default function PromotionListScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadPromotions() {
    try {
      const data = await PromotionService.getAll();
      setPromotions(data);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudieron cargar las promociones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadPromotions();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadPromotions();
  }

  function handleDelete(id: string) {
    AppAlert.alert("Eliminar promoción", "¿Seguro que querés eliminar esta promoción?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await PromotionService.remove(id);
            setPromotions((prev) => prev.filter((p) => p.id !== id));
          } catch (e: any) {
            AppAlert.alert("Error", e.message || "No se pudo eliminar la promoción.");
          }
        },
      },
    ]);
  }

  async function handleToggleVisibility(promotion: Promotion) {
    try {
      const result = await PromotionService.toggle(promotion.id);
      setPromotions((prev) =>
        prev.map((p) => (p.id === promotion.id ? { ...p, activa: result.activa } : p))
      );
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar la promoción.");
    }
  }

  const filteredPromotions = promotions.filter((p) => {
    if (filter === "todos") return true;
    return getPromotionState(p) === filter;
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Promociones"
        showBack
        rightIcon="add"
        onRightPress={() => router.push("/(restaurant)/promociones/form")}
      />
      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredPromotions}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay promociones en esta categoría.</Text>
          }
          renderItem={({ item }) => {
            const statusMeta = getStatusMeta(item);
            return (
              <EntityListCard
                imageUri={item.imagen_url}
                title={item.titulo}
                subtitle={item.descripcion ?? undefined}
                highlight={formatRange(item)}
                statusLabel={statusMeta.label}
                statusTone={statusMeta.tone}
                isHidden={!item.activa}
                onPress={() =>
                  router.push({
                    pathname: "/(restaurant)/promociones/[id]",
                    params: { id: item.id.toString() },
                  })
                }
                onEdit={() => router.push(`/(restaurant)/promociones/form?id=${item.id}`)}
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
