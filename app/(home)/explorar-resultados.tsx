import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  PanResponder,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { EmptyState } from "../components/common/EmptyState";
import {
  MockFoodItem,
  MOCK_PLATOS,
  MOCK_MENUS,
  MOCK_PROMOCIONES,
} from "./mockRestaurants";

// ==========================================================================
// TODO: mock a propósito (a pedido, sin conexión a backend todavía).
// Cuando se conecte: Platos -> GET /explore/platos (o similar),
// Menús -> GET /explore/menus-del-dia, Promociones ->
// GET /explore/promociones, todos con los mismos filtros de abajo
// como querystring. PROVINCES/CITIES -> LocationService.
//
// OJO: en el schema actual `menus_del_dia` y `promociones` no tienen
// categoria_id, así que el filtro por categoría para esos dos tabs es
// puramente de mock hasta que se resuelva eso del lado del backend.
//
// Se llega acá desde la grilla de categorías (explorar.tsx), que manda
// la categoría elegida por param. Esa categoría queda fija: acá no se
// puede cambiar, hay que volver a la grilla para elegir otra.
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

const DATA_BY_TAB: Record<Tab, MockFoodItem[]> = {
  platos: MOCK_PLATOS,
  menus: MOCK_MENUS,
  promociones: MOCK_PROMOCIONES,
};

export default function ExplorarResultadosScreen() {
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();
  const category = categoria || "Todas";

  const [tab, setTab] = useState<Tab>("platos");
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(0); // 0 = sin límite
  const [estado, setEstado] = useState<Estado>("todos");
  const [sortBy, setSortBy] = useState<SortBy>("cercania");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (maxDistance !== 0 ? 1 : 0) +
    (estado !== "todos" ? 1 : 0);

  const results = useMemo(() => {
    let data = DATA_BY_TAB[tab].filter((item) => {
      if (category !== "Todas" && item.categoria !== category) return false;
      if (
        search.trim() &&
        !item.nombre.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      if (maxDistance !== 0 && item.distanciaKm > maxDistance) return false;
      if (estado === "abierto" && !item.abierto) return false;
      return true;
    });

    data = [...data].sort((a, b) => {
      if (sortBy === "cercania") return a.distanciaKm - b.distanciaKm;
      return b.calificacion - a.calificacion;
    });

    return data;
  }, [tab, category, search, maxDistance, estado, sortBy]);

  function handleClearFilters() {
    setMaxDistance(0);
    setEstado("todos");
  }

  // Bottom sheet arrastrable: se puede deslizar hacia abajo para
  // cerrarlo, además del botón/tap fuera que ya existían. Uso
  // PanResponder + Animated (ambos de react-native core) para no
  // sumar una dependencia nueva solo para esto.
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (filtersOpen) sheetTranslateY.setValue(0);
  }, [filtersOpen]);

  const closeThreshold = 120;

  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) sheetTranslateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > closeThreshold || gesture.vy > 1.2) {
          Animated.timing(sheetTranslateY, {
            toValue: 800,
            duration: 180,
            useNativeDriver: true,
          }).start(() => setFiltersOpen(false));
        } else {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {category !== "Todas" ? category : "Explorar"}
        </Text>
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
              onPress={() => setTab(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {TAB_LABELS[t]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Buscador */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9E9E9E" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Buscar ${TAB_LABELS[tab].toLowerCase()}...`}
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

      {/* Filtros + orden */}
      <View style={styles.toolbarRow}>
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => setFiltersOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="options-outline" size={16} color="#3E2723" />
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
              color={sortBy === "cercania" ? "#FFFFFF" : "#3E2723"}
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
              color={sortBy === "calificacion" ? "#FFFFFF" : "#3E2723"}
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
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            mascot={require("../../assets/images/buscando-nene.png")}
            text={`No encontramos ${TAB_LABELS[tab].toLowerCase()} con esos filtros.`}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons name="fast-food-outline" size={20} color="#BDBDBD" />
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
                {item.restaurante} · {item.ciudad}
              </Text>

              <View style={styles.cardBottomRow}>
                <View style={styles.ratingWrap}>
                  <Ionicons name="star" size={13} color="#F5A800" />
                  <Text style={styles.ratingText}>{item.calificacion.toFixed(1)}</Text>
                  <Text style={styles.reviewsText}>({item.cantidadResenas})</Text>
                  <Text style={styles.distanceText}> · {item.distanciaKm.toFixed(1)} km</Text>
                </View>

                <View style={styles.priceWrap}>
                  {item.precioOriginal ? (
                    <Text style={styles.priceOriginal}>${item.precioOriginal.toFixed(2)}</Text>
                  ) : null}
                  <Text style={styles.price}>${item.precio.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal de filtros */}
      <Modal
        visible={filtersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setFiltersOpen(false)}
          />
          <Animated.View
            style={[styles.modalSheet, { transform: [{ translateY: sheetTranslateY }] }]}
          >
            <View {...sheetPanResponder.panHandlers}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Filtros</Text>
                <TouchableOpacity onPress={handleClearFilters}>
                  <Text style={styles.modalClearText}>Limpiar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Distancia máxima</Text>
              <View style={styles.optionsWrap}>
                {DISTANCE_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.optionChip, maxDistance === d && styles.optionChipActive]}
                    onPress={() => setMaxDistance(d)}
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
                ))}
              </View>

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
                Ver {results.length} resultado{results.length === 1 ? "" : "s"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ORANGE = "#FB8C00";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA", paddingHorizontal: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#3E2723", textAlign: "center", flex: 1 },

  segmentedWrap: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
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
  segmentActive: { backgroundColor: ORANGE },
  segmentText: { fontSize: 13, fontWeight: "700", color: "#3E2723" },
  segmentTextActive: { color: "#FFFFFF" },

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
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A" },

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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filtersButtonText: { fontSize: 13, fontWeight: "700", color: "#3E2723" },
  filtersBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ORANGE,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  sortChipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  sortChipText: { fontSize: 12, fontWeight: "600", color: "#3E2723" },
  sortChipTextActive: { color: "#FFFFFF" },

  resultsList: { paddingBottom: 120 },


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
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: "#F0F0F0" },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, justifyContent: "center" },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A", flexShrink: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardMeta: { fontSize: 12, color: "#9E9E9E", marginTop: 2 },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  reviewsText: { fontSize: 12, color: "#9E9E9E" },
  distanceText: { fontSize: 12, color: "#9E9E9E" },
  priceWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  priceOriginal: {
    fontSize: 12,
    color: "#B0B0B0",
    textDecorationLine: "line-through",
  },
  price: { fontSize: 14, fontWeight: "700", color: ORANGE },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#3E2723" },
  modalClearText: { fontSize: 13, fontWeight: "600", color: ORANGE },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3E2723",
    marginTop: 16,
    marginBottom: 8,
  },
  optionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  optionChipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  optionChipText: { fontSize: 13, fontWeight: "600", color: "#3E2723" },
  optionChipTextActive: { color: "#FFFFFF" },

  applyButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  applyButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});