import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import PublicDishService, { PublicDish } from "../../services/public-dish.service";
import PublicMenuService, { PublicMenu } from "../../services/public-menu.service";
import PublicPromotionService, { PublicPromotion } from "../../services/public-promotion.service";
import ProvinceService, { Province } from "../../services/province.service";
import LocationService, { City } from "../../services/location.service";
import UserService from "../../services/user.service";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// ==========================================================================
// Se llega acá desde la grilla de categorías (explorar.tsx) o desde el
// carrusel de categorías de Inicio (index.tsx), que mandan `categoria`
// (nombre, solo para el título) y `categoriaId` por param. Esa categoría
// queda fija: acá no se puede cambiar, hay que volver a la grilla para
// elegir otra.
//
// Conectado a datos reales:
// - Platos  -> GET /public/dishes  (PublicDishService)
// - Menús   -> GET /public/menus   (PublicMenuService)
// - Promociones -> GET /public/promotions (PublicPromotionService)
// Los tres aceptan los mismos filtros de ubicación que Explore
// (provinceId/cityId/radius+lat+lng) más categoriaId. "search" solo
// existe en el back para platos y menús (filtra por el nombre del
// plato/menú); las promociones no lo soportan todavía, por eso no hay
// buscador en esa pestaña.
// ==========================================================================

type Tab = "platos" | "menus" | "promociones";
type Estado = "todos" | "abierto";
type SortBy = "cercania" | "calificacion";

const DISTANCE_OPTIONS = [1, 3, 5, 10, 0]; // 0 = "cualquier distancia"

const TAB_LABELS: Record<Tab, string> = {
  platos: "Platos",
  menus: "Menús",
  promociones: "Promociones",
};

// Forma común a la que se mapean los 3 tipos de resultado (plato / menú /
// promoción) para poder compartir una sola UI de lista.
interface ResultItem {
  id: string;
  nombre: string;
  imagenUrl: string | null;
  restauranteId: string;
  restauranteNombre: string;
  calificacion: number;
  cantidadResenas: number;
  distanciaKm: number | null;
  abierto: boolean;
  precio: number;
}

function mapDish(d: PublicDish): ResultItem {
  return {
    id: d.id,
    nombre: d.nombre,
    imagenUrl: d.plato_imagenes?.[0]?.url ?? null,
    restauranteId: d.restaurante_id,
    restauranteNombre: d.restaurante.nombre_comercial,
    calificacion: d.restaurante.calificacion_promedio,
    cantidadResenas: d.restaurante.cantidad_resenas,
    distanciaKm: d.distancia ?? null,
    abierto: d.restaurante.estado_operativo === "abierto",
    precio: d.precio,
  };
}

function mapMenu(m: PublicMenu): ResultItem {
  return {
    id: m.id,
    nombre: m.nombre,
    imagenUrl: m.foto_url,
    restauranteId: m.restaurante_id,
    restauranteNombre: m.restaurante.nombre_comercial,
    calificacion: m.restaurante.calificacion_promedio,
    cantidadResenas: m.restaurante.cantidad_resenas,
    distanciaKm: m.distancia ?? null,
    abierto: m.restaurante.estado_operativo === "abierto",
    precio: m.precio,
  };
}

function mapPromotion(p: PublicPromotion): ResultItem {
  return {
    id: p.id,
    nombre: p.titulo,
    imagenUrl: p.imagen_url,
    restauranteId: p.restaurante_id,
    restauranteNombre: p.restaurante.nombre_comercial,
    calificacion: p.restaurante.calificacion_promedio,
    cantidadResenas: p.restaurante.cantidad_resenas,
    distanciaKm: p.distancia ?? null,
    abierto: p.restaurante.estado_operativo === "abierto",
    precio: p.precio,
  };
}

export default function ExplorarResultadosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { categoria, categoriaId } = useLocalSearchParams<{ categoria?: string; categoriaId?: string }>();
  const categoryLabel = categoria || "Explorar";

  const [tab, setTab] = useState<Tab>("platos");
  const [search, setSearch] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [province, setProvince] = useState<Province | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<City | null>(null);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState(0); // 0 = sin límite

  const [estado, setEstado] = useState<Estado>("todos");
  const [sortBy, setSortBy] = useState<SortBy>("cercania");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ubicación guardada del perfil (para el filtro de distancia) y listado
  // de provincias, una sola vez al entrar.
  useEffect(() => {
    UserService.getMe()
      .then((u) => {
        if (u.latitude != null && u.longitude != null) {
          setUserCoords({ lat: u.latitude, lng: u.longitude });
        }
      })
      .catch((e) => console.log("[ExplorarResultados] no se pudo obtener ubicación:", e));

    ProvinceService.getAll()
      .then(setProvinces)
      .catch((e) => console.log("[ExplorarResultados] no se pudieron cargar provincias:", e));
  }, []);

  // Ciudades de la provincia elegida (se resetea la ciudad al cambiar de
  // provincia, igual que en el picker de ubicación del onboarding).
  useEffect(() => {
    if (!province) {
      setCities([]);
      setCity(null);
      return;
    }
    LocationService.getCitiesByProvince(province.id)
      .then(setCities)
      .catch((e) => console.log("[ExplorarResultados] no se pudieron cargar ciudades:", e));
  }, [province]);

  const activeFilterCount =
    (province ? 1 : 0) + (city ? 1 : 0) + (maxDistance !== 0 ? 1 : 0) + (estado !== "todos" ? 1 : 0);

  const fetchResults = useCallback(async () => {
    setError(null);
    try {
      const useDistance = maxDistance !== 0 && userCoords != null;
      const baseFilters = {
        categoriaId: categoriaId || undefined,
        provinceId: province?.id,
        cityId: city?.id,
        radius: useDistance ? maxDistance : undefined,
        latitude: useDistance ? userCoords!.lat : undefined,
        longitude: useDistance ? userCoords!.lng : undefined,
      };

      let items: ResultItem[];
      if (tab === "platos") {
        const data = await PublicDishService.findAvailable({
          ...baseFilters,
          search: search.trim() || undefined,
        });
        items = data.map(mapDish);
      } else if (tab === "menus") {
        const data = await PublicMenuService.findAvailable({
          ...baseFilters,
          search: search.trim() || undefined,
        });
        items = data.map(mapMenu);
      } else {
        const data = await PublicPromotionService.findAvailable(baseFilters);
        items = data.map(mapPromotion);
      }
      setResults(items);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los resultados.");
    } finally {
      setLoading(false);
    }
  }, [tab, search, categoriaId, province, city, maxDistance, userCoords]);

  // Debounce simple para no pegarle al back en cada tecla, igual que
  // restaurantes.tsx/menus.tsx.
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchResults, 350);
    return () => clearTimeout(timeout);
  }, [fetchResults]);

  // "Abierto ahora" y el orden son puramente de cliente: ya vienen los
  // resultados del radio/categoría elegidos, esto solo reordena/filtra
  // esa misma lista.
  const displayedResults = useMemo(() => {
    let data = results;
    if (estado === "abierto") {
      data = data.filter((item) => item.abierto);
    }
    data = [...data].sort((a, b) => {
      if (sortBy === "cercania") {
        if (a.distanciaKm == null && b.distanciaKm == null) return 0;
        if (a.distanciaKm == null) return 1;
        if (b.distanciaKm == null) return -1;
        return a.distanciaKm - b.distanciaKm;
      }
      return b.calificacion - a.calificacion;
    });
    return data;
  }, [results, estado, sortBy]);

  function handleSelectProvince(p: Province | null) {
    setProvince(p);
    setCity(null);
  }

  function handleClearFilters() {
    setProvince(null);
    setCity(null);
    setMaxDistance(0);
    setEstado("todos");
  }

  function goToRestaurant(item: ResultItem) {
    router.push({ pathname: "/(home)/restaurante-detalle", params: { id: item.restauranteId } });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{categoryLabel}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Segmentado Platos / Menús / Promociones */}
      <View style={styles.segmentedWrap}>
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => {
          const active = t === tab;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => {
                setTab(t);
                setLoading(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {TAB_LABELS[t]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Buscador -- las promociones no soportan búsqueda por nombre
          todavía del lado del back. */}
      {tab !== "promociones" && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Buscar ${TAB_LABELS[tab].toLowerCase()}...`}
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filtros + orden */}
      <View style={styles.toolbarRow}>
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => setFiltersOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="options-outline" size={16} color={colors.text} />
          <Text style={styles.filtersButtonText}>Filtros</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === "cercania" && styles.sortChipActive]}
            onPress={() => setSortBy("cercania")}
          >
            <Ionicons
              name="navigate-outline"
              size={13}
              color={sortBy === "cercania" ? "#FFFFFF" : colors.text}
            />
            <Text style={[styles.sortChipText, sortBy === "cercania" && styles.sortChipTextActive]}>
              Cercanía
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === "calificacion" && styles.sortChipActive]}
            onPress={() => setSortBy("calificacion")}
          >
            <Ionicons
              name="star-outline"
              size={13}
              color={sortBy === "calificacion" ? "#FFFFFF" : colors.text}
            />
            <Text
              style={[styles.sortChipText, sortBy === "calificacion" && styles.sortChipTextActive]}
            >
              Calificación
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resultados */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.placeholder} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchResults}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="fast-food-outline" size={36} color={colors.placeholder} />
              <Text style={styles.emptyText}>
                No encontramos {TAB_LABELS[tab].toLowerCase()} con esos filtros.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => goToRestaurant(item)}>
              {item.imagenUrl ? (
                <Image source={{ uri: item.imagenUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="fast-food-outline" size={20} color={colors.placeholder} />
                </View>
              )}

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
                  {item.restauranteNombre}
                </Text>

                <View style={styles.cardBottomRow}>
                  <View style={styles.ratingWrap}>
                    <Ionicons name="star" size={13} color="#F5A800" />
                    <Text style={styles.ratingText}>{item.calificacion.toFixed(1)}</Text>
                    <Text style={styles.reviewsText}>({item.cantidadResenas})</Text>
                    {item.distanciaKm != null && (
                      <Text style={styles.distanceText}> · {item.distanciaKm.toFixed(1)} km</Text>
                    )}
                  </View>

                  <Text style={styles.price}>${item.precio.toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal de filtros */}
      <Modal
        visible={filtersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Filtros</Text>
                <TouchableOpacity onPress={handleClearFilters}>
                  <Text style={styles.modalClearText}>Limpiar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionTitle}>Provincia</Text>
              <View style={styles.optionsWrap}>
                <TouchableOpacity
                  style={[styles.optionChip, !province && styles.optionChipActive]}
                  onPress={() => handleSelectProvince(null)}
                >
                  <Text style={[styles.optionChipText, !province && styles.optionChipTextActive]}>
                    Todas
                  </Text>
                </TouchableOpacity>
                {provinces.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.optionChip, province?.id === p.id && styles.optionChipActive]}
                    onPress={() => handleSelectProvince(p)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        province?.id === p.id && styles.optionChipTextActive,
                      ]}
                    >
                      {p.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSectionTitle}>Ciudad</Text>
              <View style={styles.optionsWrap}>
                <TouchableOpacity
                  style={[styles.optionChip, !city && styles.optionChipActive]}
                  onPress={() => setCity(null)}
                  disabled={!province}
                >
                  <Text style={[styles.optionChipText, !city && styles.optionChipTextActive]}>
                    Todas
                  </Text>
                </TouchableOpacity>
                {cities.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.optionChip, city?.id === c.id && styles.optionChipActive]}
                    onPress={() => setCity(c)}
                  >
                    <Text
                      style={[styles.optionChipText, city?.id === c.id && styles.optionChipTextActive]}
                    >
                      {c.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
                {province && cities.length === 0 && (
                  <Text style={styles.modalHintText}>Esta provincia todavía no tiene ciudades cargadas.</Text>
                )}
              </View>

              <Text style={styles.modalSectionTitle}>Distancia máxima</Text>
              <View style={styles.optionsWrap}>
                {DISTANCE_OPTIONS.map((d) => {
                  const disabled = d !== 0 && userCoords == null;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.optionChip,
                        maxDistance === d && styles.optionChipActive,
                        disabled && styles.optionChipDisabled,
                      ]}
                      onPress={() => setMaxDistance(d)}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          maxDistance === d && styles.optionChipTextActive,
                        ]}
                      >
                        {d === 0 ? "Cualquiera" : `${d} km`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {userCoords == null && (
                <Text style={styles.modalHintText}>
                  Activá tu ubicación en tu perfil para poder filtrar por distancia.
                </Text>
              )}

              <Text style={styles.modalSectionTitle}>Estado del restaurante</Text>
              <View style={styles.optionsWrap}>
                <TouchableOpacity
                  style={[styles.optionChip, estado === "todos" && styles.optionChipActive]}
                  onPress={() => setEstado("todos")}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      estado === "todos" && styles.optionChipTextActive,
                    ]}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionChip, estado === "abierto" && styles.optionChipActive]}
                  onPress={() => setEstado("abierto")}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      estado === "abierto" && styles.optionChipTextActive,
                    ]}
                  >
                    Abiertos ahora
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.applyButton} onPress={() => setFiltersOpen(false)}>
              <Text style={styles.applyButtonText}>
                Ver {displayedResults.length} resultado{displayedResults.length === 1 ? "" : "s"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: "bold", color: colors.text, textAlign: "center", flex: 1 },

  segmentedWrap: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: colors.primaryDark },
  segmentText: { fontSize: 13, fontWeight: "700", color: colors.text },
  segmentTextActive: { color: "#FFFFFF" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },

  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 12,
  },
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filtersButtonText: { fontSize: 13, fontWeight: "700", color: colors.text },
  filtersBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filtersBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },

  sortRow: { flexDirection: "row", gap: 8 },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  sortChipText: { fontSize: 12, fontWeight: "600", color: colors.text },
  sortChipTextActive: { color: "#FFFFFF" },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30 },
  retryButton: {
    marginTop: 4,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  resultsList: { paddingBottom: 120 },
  emptyWrap: { alignItems: "center", marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyText: { textAlign: "center", color: colors.textSecondary, fontSize: 13, lineHeight: 19 },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.surfaceSecondary },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, justifyContent: "center" },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 15, fontWeight: "700", color: colors.text, flexShrink: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontWeight: "700", color: colors.text },
  reviewsText: { fontSize: 12, color: colors.textSecondary },
  distanceText: { fontSize: 12, color: colors.textSecondary },
  price: { fontSize: 14, fontWeight: "700", color: colors.primaryDark },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "82%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
  modalClearText: { fontSize: 13, fontWeight: "600", color: colors.primaryDark },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  modalHintText: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  optionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  optionChipDisabled: { opacity: 0.4 },
  optionChipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  optionChipTextActive: { color: "#FFFFFF" },

  applyButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  applyButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
