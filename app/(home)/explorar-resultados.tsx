import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { EmptyState } from "../components/common/EmptyState";
import { AppAlert } from "../components/common/AppAlert";
import LocationService from "../../services/location.service";
import PublicDishService, { PublicDish } from "../../services/public-dish.service";
import PublicMenuService, { PublicMenu } from "../../services/public-menu.service";
import PublicPromotionService, { PublicPromotion } from "../../services/public-promotion.service";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// ==========================================================================
// Conectado a GET /public/dishes, /public/menus, /public/promotions
// (PublicDishService / PublicMenuService / PublicPromotionService), los
// tres con los mismos filtros de ubicación que Explore. Reemplaza el mock
// que vivía en mockRestaurants.ts (MOCK_PLATOS/MOCK_MENUS/MOCK_PROMOCIONES).
//
// Se llega acá desde la grilla de categorías (explorar.tsx), que manda
// item.nombre (string) como param "categoria". Esa categoría queda fija:
// acá no se puede cambiar, hay que volver a la grilla para elegir otra.
//
// OJO distancia: el back solo calcula "distancia" si se le manda
// latitude+longitude, que acá se sacan de LocationService.getUserLocation()
// (la ubicación GUARDADA del usuario, no el GPS en vivo -- ver
// hooks/useDeviceLocation.ts). Si el usuario nunca fijó su ubicación,
// simplemente no se manda lat/lng y el filtro de distancia queda inerte
// (se muestran todos los resultados sin importar el radio elegido).
//
// El radio que se le pide al back (MAX_FETCH_RADIUS_KM) es a propósito
// más grande que las opciones del chip de distancia: así el filtro fino
// (1/3/5/10 km / "cualquiera") se resuelve del lado del cliente sobre
// el campo "distancia" ya calculado, sin tener que re-pegarle al back
// cada vez que el usuario cambia ese filtro en el bottom sheet.
// ==========================================================================

type Tab = "platos" | "menus" | "promociones";
type Estado = "todos" | "abierto";
type SortBy = "cercania" | "calificacion";

const DISTANCE_OPTIONS = [1, 3, 5, 10, 0]; // 0 = "cualquier distancia"
const MAX_FETCH_RADIUS_KM = 50;

const TAB_LABELS: Record<Tab, string> = {
  platos: "Platos",
  menus: "Menús",
  promociones: "Promociones",
};

// Mapea la pestaña activa al "tipo" que espera pedido-producto.tsx
// (mismo valor que OrderItemType en order.service.ts).
const TAB_TO_TIPO: Record<Tab, "plato" | "menu_dia" | "promocion"> = {
  platos: "plato",
  menus: "menu_dia",
  promociones: "promocion",
};

const SCREEN_HEIGHT = Dimensions.get("window").height;

// Forma normalizada para la card, ya que platos/menús/promociones tienen
// shapes distintos del backend (nombre vs. titulo, foto_url vs.
// imagen_url vs. plato_imagenes[], etc).
interface ResultItem {
  id: string;
  nombre: string;
  categoria: string | null;
  restaurante: string;
  imageUrl: string | null;
  precio: number;
  calificacion: number;
  cantidadResenas: number;
  distanciaKm: number | null;
  abierto: boolean;
}

function normalizeDish(dish: PublicDish): ResultItem {
  return {
    id: dish.id,
    nombre: dish.nombre,
    categoria: dish.categorias?.nombre ?? null,
    restaurante: dish.restaurante.nombre_comercial,
    imageUrl: dish.plato_imagenes[0]?.url ?? null,
    precio: dish.precio,
    calificacion: dish.restaurante.calificacion_promedio,
    cantidadResenas: dish.restaurante.cantidad_resenas,
    distanciaKm: dish.distancia ?? null,
    abierto: dish.restaurante.estado_operativo === "abierto",
  };
}

function normalizeMenu(menu: PublicMenu): ResultItem {
  return {
    id: menu.id,
    nombre: menu.nombre,
    categoria: menu.categorias?.nombre ?? null,
    restaurante: menu.restaurante.nombre_comercial,
    imageUrl: menu.foto_url,
    precio: menu.precio,
    calificacion: menu.restaurante.calificacion_promedio,
    cantidadResenas: menu.restaurante.cantidad_resenas,
    distanciaKm: menu.distancia ?? null,
    abierto: menu.restaurante.estado_operativo === "abierto",
  };
}

function normalizePromotion(promotion: PublicPromotion): ResultItem {
  return {
    id: promotion.id,
    nombre: promotion.titulo,
    categoria: promotion.categorias?.nombre ?? null,
    restaurante: promotion.restaurante.nombre_comercial,
    imageUrl: promotion.imagen_url,
    precio: promotion.precio,
    calificacion: promotion.restaurante.calificacion_promedio,
    cantidadResenas: promotion.restaurante.cantidad_resenas,
    distanciaKm: promotion.distancia ?? null,
    abierto: promotion.restaurante.estado_operativo === "abierto",
  };
}

export default function ExplorarResultadosScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();
  const category = categoria || "Todas";
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>("platos");
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(0); // 0 = sin límite
  const [estado, setEstado] = useState<Estado>("todos");
  const [sortBy, setSortBy] = useState<SortBy>("cercania");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [items, setItems] = useState<ResultItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const activeFilterCount =
    (maxDistance !== 0 ? 1 : 0) +
    (estado !== "todos" ? 1 : 0);

  // Recarga cada vez que cambia de pestaña (cada una pega a un endpoint
  // distinto). Los demás filtros (búsqueda, distancia, estado, orden)
  // se resuelven del lado del cliente sobre "items", sin refetch.
  useEffect(() => {
    let active = true;

    async function load() {
      setLoadingData(true);
      setLoadError(null);
      try {
        const userLocation = await LocationService.getUserLocation().catch(() => null);
        const locationFilters = userLocation
          ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              radius: MAX_FETCH_RADIUS_KM,
            }
          : {};

        let normalized: ResultItem[];
        if (tab === "platos") {
          const data = await PublicDishService.findAvailable(locationFilters);
          normalized = data.map(normalizeDish);
        } else if (tab === "menus") {
          const data = await PublicMenuService.findAvailable(locationFilters);
          normalized = data.map(normalizeMenu);
        } else {
          const data = await PublicPromotionService.findAvailable(locationFilters);
          normalized = data.map(normalizePromotion);
        }

        if (active) setItems(normalized);
      } catch (e: any) {
        if (active) {
          const msg = e.message || "No se pudieron cargar los resultados.";
          setLoadError(msg);
          AppAlert.alert("Error", msg);
        }
      } finally {
        if (active) setLoadingData(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [tab]);

  const results = useMemo(() => {
    let data = items.filter((item) => {
      if (category !== "Todas" && item.categoria !== category) return false;
      if (
        search.trim() &&
        !item.nombre.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      if (maxDistance !== 0 && item.distanciaKm != null && item.distanciaKm > maxDistance) {
        return false;
      }
      if (estado === "abierto" && !item.abierto) return false;
      return true;
    });

    data = [...data].sort((a, b) => {
      if (sortBy === "cercania") {
        const da = a.distanciaKm ?? Infinity;
        const db = b.distanciaKm ?? Infinity;
        return da - db;
      }
      return b.calificacion - a.calificacion;
    });

    return data;
  }, [items, category, search, maxDistance, estado, sortBy]);

  function handleClearFilters() {
    setMaxDistance(0);
    setEstado("todos");
  }

  // Oculta la tab bar mientras el bottom sheet está abierto, sin que se
  // "mueva" al reaparecer: se mantiene siempre el mismo estilo/posición
  // que la tab bar del _layout.tsx (bottom, borderRadius, sombra, etc.)
  // y solo se alterna la opacidad + pointerEvents. Si en vez de esto se
  // alterna entre `undefined` y `{ display: "none" }`, la tab bar pierde
  // su estilo por completo al ocultarse y tiene que "reconstruirse" al
  // volver, lo que se ve como un salto/deslizamiento.
  useEffect(() => {
    navigation.setOptions({
  tabBarStyle: [
    {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 18 + insets.bottom,
      height: 74,
      backgroundColor: colors.navbarBackground,
      borderRadius: 38,
      borderTopWidth: 0,
      elevation: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      paddingTop: 8,
    },
    filtersOpen && {
      display: "none",
    },
  ],
});

    return () => {
      navigation.setOptions({ tabBarStyle: undefined });
    };
  }, [filtersOpen, navigation, insets.bottom, colors]);

  // Bottom sheet arrastrable. OJO: acá NO se usa <Modal> de react-native a
  // propósito -- Modal crea su propia jerarquía nativa separada (una
  // ventana/UIViewController aparte) y el GestureHandlerRootView del
  // _layout.tsx no llega a cubrir lo que hay adentro, así que el gesto de
  // arrastre nunca se registraba. En su lugar esto se monta como un overlay
  // absoluto normal, dentro del mismo árbol que el resto de la pantalla.
  //
  // Se usa PanGestureHandler de react-native-gesture-handler en vez de
  // PanResponder (core de RN) porque expo-router ya corre gesture-handler
  // por debajo (swipe-back, transiciones de Stack), y un PanResponder
  // clásico pierde el gesto contra ese sistema.
  //
  // activeOffsetY={10} / failOffsetY={-10}: el handler solo se activa con
  // un arrastre claro hacia ABAJO de más de 10px; si el movimiento es hacia
  // arriba, falla enseguida y le deja el gesto al ScrollView de adentro
  // (para poder scrollear los chips normalmente) y a los TouchableOpacity
  // (para que los taps sigan funcionando).
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (filtersOpen) {
      sheetTranslateY.setValue(SCREEN_HEIGHT);
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: false,
        bounciness: 4,
      }).start();
    }
  }, [filtersOpen]);

  function closeSheet() {
    Animated.timing(sheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setFiltersOpen(false));
  }

  const closeThreshold = 120;

  function handleGestureEvent(event: any) {
    if (scrollYRef.current > 0) return; // solo arrastra si el scroll está arriba del todo
    const { translationY } = event.nativeEvent;
    if (translationY > 0) sheetTranslateY.setValue(translationY);
  }

  function handleHandlerStateChange(event: any) {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      if (translationY > closeThreshold || velocityY > 800) {
        closeSheet();
      } else {
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
      }
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
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
      {loadingData ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#FB8C00" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              mascot={require("../../assets/images/buscando-nene.png")}
              text={
                loadError
                  ? loadError
                  : `No encontramos ${TAB_LABELS[tab].toLowerCase()} con esos filtros.`
              }
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/(home)/pedido-producto",
                  params: { id: item.id, tipo: TAB_TO_TIPO[tab] },
                })
              }
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
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
                  {item.restaurante}
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

                  <View style={styles.priceWrap}>
                    <Text style={styles.price}>${item.precio.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Bottom sheet de filtros (sin <Modal> a propósito -- ver comentario
          arriba de sheetTranslateY). Se monta siempre que filtersOpen es
          true, como overlay absoluto por encima del resto de la pantalla. */}
      {filtersOpen && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeSheet}
          />
          <PanGestureHandler
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleHandlerStateChange}
            activeOffsetY={10}
            failOffsetY={-10}
          >
            <Animated.View
              style={[styles.modalSheet, { transform: [{ translateY: sheetTranslateY }] }]}
            >
              <View style={styles.dragZone}>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Filtros</Text>
                  <TouchableOpacity onPress={handleClearFilters}>
                    <Text style={styles.modalClearText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) => {
                  scrollYRef.current = e.nativeEvent.contentOffset.y;
                }}
              >
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

              <TouchableOpacity style={styles.applyButton} onPress={closeSheet}>
                <Text style={styles.applyButtonText}>
                  Ver {results.length} resultado{results.length === 1 ? "" : "s"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        </View>
      )}
    </SafeAreaView>
  );
}

const ORANGE = "#FB8C00";

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

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
  segmentActive: { backgroundColor: ORANGE },
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  sortChipText: { fontSize: 12, fontWeight: "600", color: colors.text },
  sortChipTextActive: { color: "#FFFFFF" },

  resultsList: { paddingBottom: 120 },

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
  priceWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  price: { fontSize: 14, fontWeight: "700", color: ORANGE },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
    zIndex: 9999,
    elevation: 9999,
  },
  modalSheet: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "82%",
    zIndex: 10000,
    elevation: 10000,
  },
  dragZone: { paddingTop: 4, paddingBottom: 4 },
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
  modalClearText: { fontSize: 13, fontWeight: "600", color: ORANGE },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  optionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  optionChipText: { fontSize: 13, fontWeight: "600", color: colors.text },
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