import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../../components/restaurant/ScreenHeader";
import StatusBadge, { StatusTone } from "../../components/restaurant/StatusBadge";
import PromotionService, { Promotion } from "../../../services/promotion.service";
import { AppAlert } from "../../components/common/AppAlert";

function getState(promotion: Promotion): { label: string; tone: StatusTone } {
  if (!promotion.activa) return { label: "Inactiva", tone: "neutral" };
  const today = new Date().toISOString().slice(0, 10);
  const start = promotion.fecha_inicio.slice(0, 10);
  const end = promotion.fecha_fin.slice(0, 10);
  if (today < start) return { label: "Programada", tone: "info" };
  if (today > end) return { label: "Vencida", tone: "danger" };
  return { label: "Vigente", tone: "success" };
}

export default function PromotionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    PromotionService.getById(id)
      .then(setPromotion)
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudo cargar la promoción."))
      .finally(() => setLoading(false));
  }, [id]);

  function handleDelete() {
    if (!promotion) return;
    AppAlert.alert("Eliminar promoción", "¿Seguro que querés eliminar esta promoción?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await PromotionService.remove(promotion.id);
            router.back();
          } catch (e: any) {
            AppAlert.alert("Error", e.message || "No se pudo eliminar la promoción.");
          }
        },
      },
    ]);
  }

  if (loading || !promotion) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  const statusMeta = getState(promotion);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Detalle de la promoción" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          {promotion.imagen_url ? (
            <Image source={{ uri: promotion.imagen_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#C9C9C9" />
            </View>
          )}
        </View>

        <View style={styles.topRow}>
          <Text style={styles.title}>{promotion.titulo}</Text>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="#9E9E9E" />
          <Text style={styles.dateText}>
            {promotion.fecha_inicio.slice(0, 10)} al {promotion.fecha_fin.slice(0, 10)}
          </Text>
        </View>

        {promotion.descripcion ? (
          <Text style={styles.description}>{promotion.descripcion}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/(restaurant)/promociones/form?id=${promotion.id}`)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  content: { padding: 20, paddingBottom: 48 },
  imageWrap: { height: 180, borderRadius: 16, overflow: "hidden", marginBottom: 18 },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  title: { flex: 1, fontSize: 22, fontWeight: "900", color: "#1A1A1A" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  dateText: { fontSize: 13, color: "#9E9E9E", fontWeight: "600" },
  description: { fontSize: 14, color: "#5C5C5C", marginTop: 14, lineHeight: 20 },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 32 },
  editButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FB8C00", borderRadius: 24, paddingVertical: 13 },
  editText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  deleteButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: "#E53935", borderRadius: 24, paddingVertical: 13 },
  deleteText: { color: "#E53935", fontWeight: "700", fontSize: 14 },
});
