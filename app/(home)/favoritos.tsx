import React, { useCallback, useMemo, useState } from "react";
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
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import FavoriteService, { FavoriteItem } from "../../services/favorite.service";
import { optimizedImageUri } from "../../utils/imageUrl";
import { EmptyState } from "../components/common/EmptyState";
import { AppAlert } from "../components/common/AppAlert";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

const OPEN_LABEL: Record<string, { text: string; color: string }> = {
  abierto: { text: "Abierto", color: "#43A047" },
  cerrado: { text: "Cerrado", color: "#E53935" },
  cerrado_temporal: { text: "Cerrado temporalmente", color: "#E53935" },
  vacaciones: { text: "En vacaciones", color: "#FB8C00" },
};

export default function FavoritosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  function goToRestaurant(item: FavoriteItem) {
    router.push({
      pathname: "/(home)/restaurante-detalle",
      params: { id: item.restaurant.id },
    });
  }

  function handleRemove(item: FavoriteItem) {
    AppAlert.alert(
      "Quitar de favoritos",
      `¿Seguro que quieres quitar "${item.restaurant.nombreComercial}" de tus favoritos?`,
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
          <EmptyState
            mascot={require("../../assets/images/favoritos-nene.png")}
            text="Todavía no tienes restaurantes favoritos. Explora y toca el corazón en el que te guste."
          />
        }
        renderItem={({ item }) => {
          const status = OPEN_LABEL[item.restaurant.estadoOperativo] ?? OPEN_LABEL.cerrado;
          const isRemoving = removingId === item.restaurant.id;

          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => goToRestaurant(item)}>
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
                    <Image source={{ uri: optimizedImageUri(item.restaurant.logoUrl, "thumb") }} style={styles.logo} />
                  ) : (
                    <View style={[styles.logo, styles.logoPlaceholder]}>
                      <Ionicons name="storefront-outline" size={16} color={colors.placeholder} />
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
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 12 },
  loader: { marginTop: 40 },
  list: { paddingBottom: 120 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cover: {
    width: "100%",
    height: 120,
    backgroundColor: colors.surfaceSecondary,
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
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
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
    backgroundColor: colors.surfaceSecondary,
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
    color: colors.text,
  },
  city: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.text,
  },
  reviewsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  categoriesText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
});
