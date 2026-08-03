import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import ExploreService, { ExploreRestaurant } from "../../services/explore.service";
import UserService from "../../services/user.service";
import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";

// Listado completo de restaurantes ("ver todos" desde Inicio). Solo
// muestra ícono/logo + nombre -- sin rating, categoría ni distancia --
// mismo criterio visual que la tira de Inicio. El detalle completo se
// ve recién al entrar a restaurante-detalle.tsx.
//
// Conectado a GET /explore/restaurants (ExploreController del back):
// - search: nombre del restaurante.
// - latitude/longitude/radius: se arma con la ubicación guardada en el
//   perfil del usuario (la fijada en el mapa), igual que en Inicio.
//   Si el usuario no tiene ubicación guardada, el filtro de distancia
//   queda deshabilitado y solo se lista/busca por nombre.

const DISTANCE_OPTIONS = [1, 3, 5, 10, 0]; // 0 = "cualquiera"

export default function RestaurantesScreen() {
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(0);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [results, setResults] = useState<ExploreRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ubicación guardada del perfil, para poder filtrar por distancia.
  useEffect(() => {
    UserService.getMe()
      .then((u) => {
        if (u.latitude != null && u.longitude != null) {
          setUserCoords({ lat: u.latitude, lng: u.longitude });
        }
      })
      .catch((e) => console.log("[RestaurantesScreen] no se pudo obtener ubicación:", e));
  }, []);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const useDistance = maxDistance !== 0 && userCoords != null;
      const data = await ExploreService.findRestaurants({
        search: search.trim() || undefined,
        radius: useDistance ? maxDistance : undefined,
        latitude: useDistance ? userCoords!.lat : undefined,
        longitude: useDistance ? userCoords!.lng : undefined,
      });
      setResults(data);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los restaurantes.");
    } finally {
      setLoading(false);
    }
  }, [search, maxDistance, userCoords]);

  // Debounce simple para no pegarle al back en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(fetchRestaurants, 350);
    return () => clearTimeout(timeout);
  }, [fetchRestaurants]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingScreen>
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
          style={styles.distanceListWrapper}
          showsHorizontalScrollIndicator={false}
          data={DISTANCE_OPTIONS}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.distanceList}
          renderItem={({ item }) => {
            const active = item === maxDistance;
            const disabled = item !== 0 && userCoords == null;
            return (
              <TouchableOpacity
                style={[styles.sortChip, active && styles.sortChipActive, disabled && styles.sortChipDisabled]}
                onPress={() => setMaxDistance(item)}
                activeOpacity={0.85}
                disabled={disabled}
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

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#FB8C00" />
          </View>
        ) : error ? (
          <View style={styles.centerWrap}>
            <Ionicons name="cloud-offline-outline" size={36} color="#D9D9D9" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRestaurants}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={results}
            numColumns={3}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="restaurant-outline" size={36} color="#D9D9D9" />
                <Text style={styles.emptyText}>No encontramos restaurantes con ese nombre.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/(home)/restaurante-detalle", params: { id: item.id } })}
              >
                <View style={styles.logoCircle}>
                  {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} style={styles.logoImage} />
                  ) : (
                    <Ionicons name="storefront-outline" size={26} color="#BDBDBD" />
                  )}
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: item.estado_operativo === "abierto" ? "#43A047" : "#E53935" },
                    ]}
                  />
                </View>
                <Text style={styles.cardName} numberOfLines={2}>
                  {item.nombre_comercial}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </KeyboardAvoidingScreen>
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

  // flexGrow: 0 para que el FlatList horizontal no se estire a lo ancho
  // de la pantalla y termine "adivinando" mal dónde corta el contenido.
  distanceListWrapper: { flexGrow: 0, marginBottom: 14 },
  // paddingRight: antes no había margen al final, entonces el último
  // chip ("Cualquier distancia") quedaba pegado/cortado justo en el
  // borde de la pantalla en vez de tener aire como el resto.
  distanceList: { gap: 8, paddingRight: 16 },
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
  sortChipDisabled: { opacity: 0.4 },
  sortChipText: { fontSize: 12, fontWeight: "700", color: "#3E2723" },
  sortChipTextActive: { color: "#FFFFFF" },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30 },
  retryButton: {
    marginTop: 4,
    backgroundColor: "#FB8C00",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  resultsList: { paddingBottom: 120 },
  row: { justifyContent: "space-between", marginBottom: 22 },
  emptyWrap: { alignItems: "center", marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyText: { textAlign: "center", color: "#9E9E9E", fontSize: 13, lineHeight: 19 },

  card: { width: "31%", alignItems: "center" },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoImage: { width: "100%", height: "100%", borderRadius: 38, resizeMode: "cover" },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cardName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
});