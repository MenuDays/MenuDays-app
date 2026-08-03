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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import PublicMenuService, { PublicMenu } from "../../services/public-menu.service";
import UserService from "../../services/user.service";

// Pestaña "Menús": todos los menús del día vigentes/publicados cerca del
// comensal, entre restaurantes (a diferencia de "Menú del día" dentro de
// restaurante-detalle.tsx, que solo muestra los de ESE restaurante).
//
// Conectado a GET /public/menus (PublicMenuController del back), mismos
// filtros de ubicación que Explorar/Restaurantes:
// - search: nombre del menú del día (campo `nombre` de menus_del_dia,
//   ej. "Seco de pollo"). OJO: esto es DISTINTO al catálogo de `platos`
//   (dish.service.ts / módulo dishes), que no tiene relación con
//   menus_del_dia en Prisma -- acá no se busca ahí.
// - latitude/longitude/radius: ubicación guardada en el perfil, igual que
//   en restaurantes.tsx. Sin ubicación guardada, se listan todos sin
//   ordenar/filtrar por distancia.
//
// Tocar una card navega al restaurante dueño del menú (todavía no existe
// pantalla de detalle de un menú individual/producto conectada a datos
// reales -- ver TODOs en pedido-producto.tsx).

const OPEN_LABEL: Record<string, { text: string; color: string }> = {
  abierto: { text: "Abierto", color: "#43A047" },
  cerrado: { text: "Cerrado", color: "#E53935" },
  cerrado_temporal: { text: "Cerrado temporalmente", color: "#E53935" },
  vacaciones: { text: "En vacaciones", color: "#FB8C00" },
};

const DISTANCE_OPTIONS = [1, 3, 5, 10, 0]; // 0 = "cualquiera"

export default function MenusScreen() {
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(0);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [menus, setMenus] = useState<PublicMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    UserService.getMe()
      .then((u) => {
        if (u.latitude != null && u.longitude != null) {
          setUserCoords({ lat: u.latitude, lng: u.longitude });
        }
      })
      .catch((e) => console.log("[MenusScreen] no se pudo obtener ubicación:", e));
  }, []);

  const fetchMenus = useCallback(async () => {
    setError(null);
    try {
      const useDistance = maxDistance !== 0 && userCoords != null;
      const data = await PublicMenuService.findAvailable({
        search: search.trim() || undefined,
        radius: useDistance ? maxDistance : undefined,
        latitude: useDistance ? userCoords!.lat : undefined,
        longitude: useDistance ? userCoords!.lng : undefined,
      });
      setMenus(data);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los menús.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, maxDistance, userCoords]);

  // Debounce simple para no pegarle al back en cada tecla, igual que
  // restaurantes.tsx.
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchMenus, 350);
    return () => clearTimeout(timeout);
  }, [fetchMenus]);

  function handleRefresh() {
    setRefreshing(true);
    fetchMenus();
  }

  function goToRestaurant(menu: PublicMenu) {
    router.push({
      pathname: "/(home)/restaurante-detalle",
      params: { id: menu.restaurante_id },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Menús</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9E9E9E" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en menús del día..."
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchMenus}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={menus}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="restaurant-outline" size={36} color="#D9D9D9" />
              <Text style={styles.emptyText}>
                No hay menús del día publicados cerca tuyo por ahora. Probá ampliar la distancia o volvé más tarde.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = OPEN_LABEL[item.restaurante.estado_operativo] ?? OPEN_LABEL.cerrado;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => goToRestaurant(item)}
              >
                <View style={styles.imageWrap}>
                  {item.foto_url ? (
                    <Image source={{ uri: item.foto_url }} style={styles.image} />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <Ionicons name="restaurant-outline" size={24} color="#BDBDBD" />
                    </View>
                  )}
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>${item.precio.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.info}>
                  <View style={styles.restaurantRow}>
                    {item.restaurante.logo_url ? (
                      <Image source={{ uri: item.restaurante.logo_url }} style={styles.logo} />
                    ) : (
                      <View style={[styles.logo, styles.logoPlaceholder]}>
                        <Ionicons name="storefront-outline" size={12} color="#BDBDBD" />
                      </View>
                    )}
                    <Text style={styles.restaurantName} numberOfLines={1}>
                      {item.restaurante.nombre_comercial}
                    </Text>
                  </View>

                  <Text style={styles.dishName} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  {item.descripcion ? (
                    <Text style={styles.dishDescription} numberOfLines={1}>
                      {item.descripcion}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={12} color="#F5A800" />
                      <Text style={styles.metaText}>
                        {item.restaurante.calificacion_promedio.toFixed(1)}
                      </Text>
                    </View>

                    {item.distancia != null && (
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={12} color="#9E9E9E" />
                        <Text style={styles.metaText}>{item.distancia.toFixed(1)} km</Text>
                      </View>
                    )}

                    <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>
                      {status.text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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

  distanceListWrapper: { flexGrow: 0, marginBottom: 14 },
  distanceList: { gap: 8 },
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

  list: { paddingBottom: 120 },
  emptyWrap: { alignItems: "center", marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyText: { textAlign: "center", color: "#9E9E9E", fontSize: 13, lineHeight: 19 },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  imageWrap: { width: 100, height: 100, position: "relative" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  priceBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },

  info: { flex: 1, padding: 10, justifyContent: "center", gap: 2 },
  restaurantRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  logo: { width: 18, height: 18, borderRadius: 9 },
  logoPlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  restaurantName: { flex: 1, fontSize: 11, fontWeight: "700", color: "#9E9E9E" },

  dishName: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  dishDescription: { fontSize: 12, color: "#9E9E9E", marginTop: 1 },

  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, fontWeight: "700", color: "#3E2723" },
  statusText: { fontSize: 11, fontWeight: "700" },
});