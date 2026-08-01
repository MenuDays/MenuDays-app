import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import FavoriteService, { FavoriteItem } from "../../services/favorite.service";
import { AppAlert } from "../components/common/AppAlert";

const OPEN_LABEL: Record<string, { text: string; color: string }> = {
  abierto: { text: "Abierto", color: "#43A047" },
  cerrado: { text: "Cerrado", color: "#E53935" },
  cerrado_temporal: { text: "Cerrado temporalmente", color: "#E53935" },
  vacaciones: { text: "En vacaciones", color: "#FB8C00" },
};

export default function FavoritosScreen() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function loadFavorites() {
    try {
      const data = await FavoriteService.getAll();
      setFavorites(data);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudieron cargar tus favoritos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadFavorites();
  }

  function handleRemove(item: FavoriteItem) {
    AppAlert.alert(
      "Quitar de favoritos",
      `¿Seguro que querés quitar "${item.restaurant.nombreComercial}" de tus favoritos?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: async () => {
            setRemovingId(item.restaurant.id);
            try {
              await FavoriteService.remove(item.restaurant.id);
              setFavorites((prev) =>
                prev.filter((f) => f.restaurant.id !== item.restaurant.id)
              );
            } catch (e: any) {
              AppAlert.alert("Error", e.message || "No se pudo quitar de favoritos.");
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Favoritos</Text>
        <ActivityIndicator size="large" color="#FB8C00" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.favoriteId.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="heart-outline" size={36} color="#D9D9D9" />
            <Text style={styles.emptyText}>
              Todavía no tenés restaurantes favoritos. Explorá y tocá el corazón en el que te guste.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = OPEN_LABEL[item.restaurant.estadoOperativo] ?? OPEN_LABEL.cerrado;
          const isRemoving = removingId === item.restaurant.id;

          return (
            // NOTA: todavía no existe una pantalla de detalle de
            // restaurante del lado cliente (solo hay placeholder en
            // explorar.tsx). Cuando la armes, hay que envolver esto en un
            // TouchableOpacity que navegue a esa ruta con el id.
            <View style={styles.card}>
              <Image
                source={
                  item.restaurant.portadaUrl
                    ? { uri: item.restaurant.portadaUrl }
                    : undefined
                }
                style={[styles.cover, !item.restaurant.portadaUrl && styles.coverPlaceholder]}
              />

              <TouchableOpacity
                style={styles.heartButton}
                onPress={() => handleRemove(item)}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#FB8C00" />
                ) : (
                  <Ionicons name="heart" size={18} color="#FB8C00" />
                )}
              </TouchableOpacity>

              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  {item.restaurant.logoUrl ? (
                    <Image source={{ uri: item.restaurant.logoUrl }} style={styles.logo} />
                  ) : (
                    <View style={[styles.logo, styles.logoPlaceholder]}>
                      <Ionicons name="storefront-outline" size={16} color="#BDBDBD" />
                    </View>
                  )}

                  <View style={styles.cardHeaderText}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.restaurant.nombreComercial}
                    </Text>
                    {item.restaurant.ciudad ? (
                      <Text style={styles.city} numberOfLines={1}>
                        {item.restaurant.ciudad}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.ratingWrap}>
                    <Ionicons name="star" size={13} color="#F5A800" />
                    <Text style={styles.ratingText}>
                      {item.restaurant.calificacionPromedio.toFixed(1)}
                    </Text>
                    <Text style={styles.reviewsText}>
                      ({item.restaurant.cantidadResenas})
                    </Text>
                  </View>

                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.text}
                  </Text>
                </View>

                {item.restaurant.categorias.length > 0 ? (
                  <Text style={styles.categoriesText} numberOfLines={1}>
                    {item.restaurant.categorias.map((c) => c.nombre).join(" · ")}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: "#3E2723", marginBottom: 12 },
  loader: { marginTop: 40 },
  list: { paddingBottom: 120 },
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cover: {
    width: "100%",
    height: 120,
    backgroundColor: "#F0F0F0",
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  heartButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  cardBody: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },
  logoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  city: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  reviewsText: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  categoriesText: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 6,
  },
});