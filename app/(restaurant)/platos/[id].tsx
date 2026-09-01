import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../../components/restaurant/ScreenHeader";
import StatusBadge, { StatusTone } from "../../components/restaurant/StatusBadge";
import DishService, { Dish } from "../../../services/dish.service";
import { AppAlert } from "../../components/common/AppAlert";
import { Toast } from "../../components/common/Toast";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";
import { optimizedImageUri } from "../../../utils/imageUrl";

function getStatusMeta(dish: Dish): { label: string; tone: StatusTone } {
  if (!dish.activo) return { label: "Inactivo", tone: "neutral" };
  if (dish.estado === "agotado") return { label: "Agotado", tone: "danger" };
  return { label: "Disponible", tone: "success" };
}

export default function DishDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function loadDish() {
    if (!id) return;
    DishService.getById(id)
      .then(setDish)
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudo cargar el plato."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    setLoading(true);
    loadDish();
  }, [id]);

  function handleRefresh() {
    setRefreshing(true);
    loadDish();
  }

  function handleDelete() {
    if (!dish) return;
    AppAlert.alert("Eliminar plato", "¿Seguro que quieres eliminar este plato?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await DishService.remove(dish.id);
            Toast.success("Plato eliminado");
            router.back();
          } catch (e: any) {
            AppAlert.alert("Error", e.message || "No se pudo eliminar el plato.");
          }
        },
      },
    ]);
  }

  if (loading || !dish) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  const statusMeta = getStatusMeta(dish);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Detalle del plato" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
      >
        <View style={styles.imageWrap}>
          {dish.plato_imagenes[0]?.url ? (
            <Image source={{ uri: optimizedImageUri(dish.plato_imagenes[0].url, "card") }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color={colors.placeholder} />
            </View>
          )}
        </View>

        <View style={styles.topRow}>
          <Text style={styles.name}>{dish.nombre}</Text>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
        </View>

        {dish.categorias?.nombre ? (
          <View style={styles.categoryRow}>
            <Ionicons name="pricetags-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.categoryText}>{dish.categorias.nombre}</Text>
          </View>
        ) : null}

        <Text style={styles.price}>${Number(dish.precio).toFixed(2)}</Text>
        {dish.descripcion ? <Text style={styles.description}>{dish.descripcion}</Text> : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/(restaurant)/platos/form?id=${dish.id}`)}
          >
            <Ionicons name="pencil" size={18} color="#FFFFFF" />
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#E53935" />
            <Text style={styles.deleteText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenSolid },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.screenSolid },
  content: { padding: 20, paddingBottom: 48 },
  imageWrap: { height: 180, borderRadius: 16, overflow: "hidden", marginBottom: 18 },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  name: { flex: 1, fontSize: 22, fontWeight: "900", color: colors.text },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  categoryText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  price: { fontSize: 18, fontWeight: "800", color: "#FB8C00", marginTop: 10 },
  description: { fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 32 },
  editButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FB8C00", borderRadius: 24, paddingVertical: 13 },
  editText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  deleteButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: "#E53935", borderRadius: 24, paddingVertical: 13 },
  deleteText: { color: "#E53935", fontWeight: "700", fontSize: 14 },
});
