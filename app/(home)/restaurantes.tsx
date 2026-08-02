import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_RESTAURANTS } from "./mockRestaurants";

// TODO: mock a propósito (sin conexión a backend todavía). Cuando se
// conecte, reemplazar por ExploreService pegándole a
// GET /explore/restaurants?search=... (sin filtros extra, esta
// pantalla es solo buscador + lista -- los filtros completos viven
// en la pantalla "Explorar" del tab bar).

const DISTANCE_OPTIONS = [1, 3, 5, 10, 0]; // 0 = "cualquiera"

export default function RestaurantesScreen() {
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(0);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    let data = term
      ? MOCK_RESTAURANTS.filter((r) => r.nombre.toLowerCase().includes(term))
      : MOCK_RESTAURANTS;

    if (maxDistance !== 0) {
      data = data
        .filter((r) => r.distanciaKm <= maxDistance)
        .sort((a, b) => a.distanciaKm - b.distanciaKm);
    }

    return data;
  }, [search, maxDistance]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Restaurantes</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9E9E9E" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar restaurante..."
          placeholderTextColor="#B0B0B0"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#B0B0B0" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={DISTANCE_OPTIONS}
        keyExtractor={(item) => item.toString()}
        contentContainerStyle={styles.distanceList}
        renderItem={({ item }) => {
          const active = item === maxDistance;
          return (
            <TouchableOpacity
              style={[styles.sortChip, active && styles.sortChipActive]}
              onPress={() => setMaxDistance(item)}
              activeOpacity={0.85}
            >
              {item === 0 && (
                <Ionicons
                  name="navigate-outline"
                  size={13}
                  color={active ? "#FFFFFF" : "#3E2723"}
                />
              )}
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                {item === 0 ? "Cualquier distancia" : `${item} km`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="restaurant-outline" size={36} color="#D9D9D9" />
            <Text style={styles.emptyText}>No encontramos restaurantes con ese nombre.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Ionicons name="storefront-outline" size={20} color="#BDBDBD" />
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: item.abierto ? "#43A047" : "#E53935" },
                  ]}
                />
              </View>

              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.categoria} · {item.ciudad}
              </Text>

              <View style={styles.bottomRow}>
                <View style={styles.ratingWrap}>
                  <Ionicons name="star" size={13} color="#F5A800" />
                  <Text style={styles.ratingText}>{item.calificacion.toFixed(1)}</Text>
                  <Text style={styles.reviewsText}>({item.cantidadResenas})</Text>
                </View>
                <Text style={styles.distanceText}>{item.distanciaKm.toFixed(1)} km</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#3E2723", marginTop: 8, marginBottom: 12 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A" },

  distanceList: { gap: 8, paddingBottom: 14 },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  sortChipActive: { backgroundColor: "#FB8C00", borderColor: "#FB8C00" },
  sortChipText: { fontSize: 12, fontWeight: "700", color: "#3E2723" },
  sortChipTextActive: { color: "#FFFFFF" },

  resultsList: { paddingBottom: 120 },
  emptyWrap: { alignItems: "center", marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyText: { textAlign: "center", color: "#9E9E9E", fontSize: 13, lineHeight: 19 },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logo: { width: 52, height: 52, borderRadius: 12, backgroundColor: "#F0F0F0" },
  logoPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, justifyContent: "center" },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A", flexShrink: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardMeta: { fontSize: 12, color: "#9E9E9E", marginTop: 2 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  reviewsText: { fontSize: 12, color: "#9E9E9E" },
  distanceText: { fontSize: 12, fontWeight: "600", color: "#3E2723" },
});