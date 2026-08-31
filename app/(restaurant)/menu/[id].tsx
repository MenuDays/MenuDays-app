import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../../components/restaurant/ScreenHeader";
import StatusBadge, { StatusTone } from "../../components/restaurant/StatusBadge";
import MenuService, { Menu, MenuStatus } from "../../../services/menu.service";
import { AppAlert } from "../../components/common/AppAlert";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";
import { optimizedImageUri } from "../../../utils/imageUrl";

const STATUS_META: Record<MenuStatus, { label: string; tone: StatusTone }> = {
  programado: { label: "Programado", tone: "info" },
  publicado: { label: "Publicado", tone: "success" },
  oculto: { label: "Oculto", tone: "neutral" },
  agotado: { label: "Agotado", tone: "danger" },
};

export default function MenuDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function loadMenu() {
    if (!id) return;
    MenuService.getById(id)
      .then(setMenu)
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudo cargar el menú."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    setLoading(true);
    loadMenu();
  }, [id]);

  function handleRefresh() {
    setRefreshing(true);
    loadMenu();
  }

  function handleDelete() {
    if (!menu) return;
    AppAlert.alert("Eliminar menú", "¿Seguro que quieres eliminar este menú?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await MenuService.remove(menu.id);
            router.back();
          } catch (e: any) {
            AppAlert.alert("Error", e.message || "No se pudo eliminar el menú.");
          }
        },
      },
    ]);
  }

  if (loading || !menu) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  const statusMeta = STATUS_META[menu.estado];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Detalle del menú" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
      >
        <View style={styles.imageWrap}>
          {menu.foto_url ? (
            <Image source={{ uri: optimizedImageUri(menu.foto_url, "card") }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color={colors.placeholder} />
            </View>
          )}
        </View>

        <View style={styles.topRow}>
          <Text style={styles.name}>{menu.nombre}</Text>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
        </View>

        <Text style={styles.price}>${Number(menu.precio).toFixed(2)}</Text>
        {menu.descripcion ? <Text style={styles.description}>{menu.descripcion}</Text> : null}

        <View style={styles.datesRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.datesText}>
            {menu.fecha_inicio.slice(0, 10)} — {menu.fecha_fin.slice(0, 10)}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/(restaurant)/menu/form?id=${menu.id}`)}
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
  price: { fontSize: 18, fontWeight: "800", color: "#FB8C00", marginTop: 6 },
  description: { fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
  datesRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  datesText: { fontSize: 13, color: colors.textSecondary },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 32 },
  editButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FB8C00", borderRadius: 24, paddingVertical: 13 },
  editText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  deleteButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: "#E53935", borderRadius: 24, paddingVertical: 13 },
  deleteText: { color: "#E53935", fontWeight: "700", fontSize: 14 },
});