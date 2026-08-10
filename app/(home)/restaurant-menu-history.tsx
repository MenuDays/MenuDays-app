import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import RestaurantService, { PublicMenuHistoryItem } from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";

// OJO: RestaurantService.getMenuHistory() pega a GET /restaurants/:id/menus,
// que TODAVÍA NO EXISTE en el backend (ver el comentario en
// restaurant.service.ts). Hasta que se agregue esa ruta del lado servidor,
// esta pantalla va a recibir un error (probablemente 404) y mostrar el
// estado vacío de abajo en vez de romper -- no hay nada más para hacer acá
// sin tocar el backend.
export default function RestaurantMenuHistoryScreen() {
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>();

  const [menus, setMenus] = useState<PublicMenuHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Reseteo antes de cada fetch: sin esto, si un restaurante da 404
    // (histórico no disponible todavía en el back) "unavailable" queda
    // en true para siempre, y al entrar al histórico de otro
    // restaurante que sí tiene datos se seguía mostrando "Próximamente"
    // en vez de la lista real.
    setLoading(true);
    setUnavailable(false);
    RestaurantService.getMenuHistory(id)
      .then((data) =>
        setMenus([...data].sort((a, b) => (a.fechaInicio < b.fechaInicio ? 1 : -1)))
      )
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Histórico de menús{nombre ? ` · ${nombre}` : ""}
        </Text>
        <View style={styles.roundButton} />
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={{ marginTop: 40 }} />
      ) : unavailable ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="time-outline" size={36} color="#D9D9D9" />
          <Text style={styles.emptyTitle}>Próximamente</Text>
          <Text style={styles.emptyText}>
            El histórico de menús todavía no está disponible para este restaurante.
          </Text>
        </View>
      ) : (
        <FlatList
          data={menus}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.foto_url ? (
                <Image source={{ uri: item.foto_url }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name="restaurant-outline" size={18} color="#BDBDBD" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>${item.precio.toFixed(2)}</Text>
                  </View>
                </View>
                {item.descripcion ? (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.descripcion}
                  </Text>
                ) : null}
                <Text style={styles.dateRange}>
                  {formatDate(item.fechaInicio)} - {formatDate(item.fechaFin)}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="restaurant-outline" size={36} color="#D9D9D9" />
              <Text style={styles.emptyText}>Este restaurante todavía no tiene menús anteriores.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  roundButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "800", color: "#1A1A1A" },

  list: { padding: 20, paddingBottom: 60 },

  card: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 16,
    padding: 10,
  },
  image: { width: 64, height: 64, borderRadius: 12 },
  imagePlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  name: { flex: 1, fontSize: 14, fontWeight: "800", color: "#1A1A1A" },
  description: { fontSize: 12, color: "#9E9E9E", marginTop: 4 },
  dateRange: { fontSize: 11, color: "#B0B0B0", fontWeight: "700", marginTop: 6 },
  priceBadge: { backgroundColor: "#FFA726", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  priceBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

  emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 50, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  emptyText: { fontSize: 13, color: "#9E9E9E", textAlign: "center" },
});