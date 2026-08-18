import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";

import RestaurantService, {
  PublicDish,
  PublicMenuDelDia,
  PublicPromotion,
  RestaurantPublicDetail,
} from "../../services/restaurant.service";
import { getCategoryIcon } from "../../constants/categoryIcons";
import { EmptyState } from "../components/common/EmptyState";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Pantalla premium de catálogo, a la que se llega desde el botón "Ver
// Menú" de restaurante-detalle.tsx (que antes mostraba Menú/Platos/
// Promociones apiladas en pestañas dentro de la misma pantalla larga --
// quedaba todo muy encimado). Acá cada sección tiene su propio tab a
// pantalla completa, estilo tab bar premium de iOS.
//
// Refetchea el detalle público (GET /restaurants/:id) en vez de recibir
// todo por params, mismo criterio que restaurant-gallery.tsx /
// restaurant-reviews.tsx: es la única forma de pasar objetos grandes
// entre pantallas sin serializar JSON gigante en la URL.

type CatalogTab = "menu" | "platos" | "promos" | "galeria";
const TABS_ORDER: CatalogTab[] = ["menu", "platos", "promos", "galeria"];

const { width: SCREEN_W } = Dimensions.get("window");
const GALLERY_GAP = 8;
const GALLERY_COLUMNS = 3;
const GALLERY_THUMB =
  (SCREEN_W - 20 * 2 - GALLERY_GAP * (GALLERY_COLUMNS - 1)) / GALLERY_COLUMNS;

interface PlatoCategoryGroup {
  id: number;
  nombre: string;
  iconoUrl: string | null;
  platos: PublicDish[];
}

// Agrupa el menú del día por Colección (concepto independiente de las
// categorías de plato -- ver menu-collection.service.ts). Se arma acá
// mismo, en el contexto de UN restaurante, a partir de los menús que ya
// vienen embebidos en RestaurantPublicDetail -- NO se usa en Home general
// ni en la pestaña global de Menús, que mezclan varios restaurantes.
interface MenuCollectionGroup {
  id: string;
  nombre: string;
  orden: number;
  menus: PublicMenuDelDia[];
}

export default function RestauranteCatalogoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id, nombre, ofreceDelivery, nombreDelivery, ownerPreview } =
    useLocalSearchParams<{
      id: string;
      nombre?: string;
      ofreceDelivery?: string;
      nombreDelivery?: string;
      ownerPreview?: string;
    }>();
  const isOwnerPreview = ownerPreview === "true";

  const [restaurant, setRestaurant] = useState<RestaurantPublicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<CatalogTab>("menu");
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  // Un solo input de búsqueda reusado por las 3 pestañas de productos
  // (Menú/Platos/Promos) -- se limpia al cambiar de pestaña para no dejar
  // un filtro de "Platos" aplicado sin querer sobre "Promos", por ejemplo.
  const [search, setSearch] = useState("");

  function changeTab(next: CatalogTab) {
    setTab(next);
    setSearch("");
  }

  // Ref con el tab actual: el PanResponder se crea UNA sola vez (adentro
  // de useRef), así que si sus handlers leyeran "tab" directo quedarían
  // con el valor de la primera vez que se armó (closure vieja). Leyendo
  // de este ref siempre tienen el valor más nuevo.
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  // Deslizar con el dedo para cambiar de pestaña (Menú/Platos/Promos/
  // Galería), en cualquiera de las dos direcciones. Solo reclama el
  // gesto ante un arrastre CLARAMENTE horizontal (dx bien mayor a dy) y
  // recién después de moverse una distancia real -- así no compite con
  // el scroll vertical normal de las listas de cada pestaña.
  const swipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5 && Math.abs(gesture.dx) > 14,
      onPanResponderRelease: (_, gesture) => {
        const SWIPE_THRESHOLD = 60;
        if (Math.abs(gesture.dx) < SWIPE_THRESHOLD && Math.abs(gesture.vx) < 0.35) return;

        const currentIndex = TABS_ORDER.indexOf(tabRef.current);
        if (gesture.dx < 0) {
          // Deslizó de derecha a izquierda -> avanza a la siguiente.
          const nextIndex = Math.min(TABS_ORDER.length - 1, currentIndex + 1);
          if (nextIndex !== currentIndex) changeTab(TABS_ORDER[nextIndex]);
        } else {
          // Deslizó de izquierda a derecha -> vuelve a la anterior.
          const prevIndex = Math.max(0, currentIndex - 1);
          if (prevIndex !== currentIndex) changeTab(TABS_ORDER[prevIndex]);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setRestaurant(null);
    RestaurantService.getPublicDetail(id)
      .then((data) => {
        setRestaurant(data);
        // Arranca en la primera pestaña con contenido si "Menú" está vacía.
        if (data.menus.length === 0) {
          if (data.platos.length > 0) setTab("platos");
          else if (data.promociones.length > 0) setTab("promos");
          else if (data.galeria.length > 0) setTab("galeria");
        }
      })
      .catch((e: any) => setError(e.message || "No se pudo cargar el menú."))
      .finally(() => setLoading(false));
  }, [id]);

  // Platos agrupados SOLO por las categorías que el restaurante eligió
  // (restaurant.categorias), no por todas las categorías que existen en
  // el sistema -- así reaparece el ícono PNG animado de cada una.
  const platosByCategory = useMemo<PlatoCategoryGroup[]>(() => {
    if (!restaurant) return [];
    return restaurant.categorias
      .map((rc) => ({
        id: rc.categoria.id,
        nombre: rc.categoria.nombre,
        iconoUrl: rc.categoria.iconos?.url ?? null,
        platos: restaurant.platos.filter((p) => p.categorias?.id === rc.categoria.id),
      }))
      .filter((group) => group.platos.length > 0);
  }, [restaurant]);

  // Edge case: un plato cuya categoría no está entre las elegidas por el
  // restaurante (no debería pasar, pero si pasa no lo escondemos).
  const platosSinCategoria = useMemo(() => {
    if (!restaurant) return [];
    const idsConocidos = new Set(restaurant.categorias.map((rc) => rc.categoria.id));
    return restaurant.platos.filter(
      (p) => !p.categorias || !idsConocidos.has(p.categorias.id)
    );
  }, [restaurant]);

  const query = search.trim().toLowerCase();
  const matchesQuery = (nombre: string, descripcion?: string | null) =>
    !query ||
    nombre.toLowerCase().includes(query) ||
    (descripcion ?? "").toLowerCase().includes(query);

  const filteredMenus = useMemo(
    () => (restaurant ? restaurant.menus.filter((m) => matchesQuery(m.nombre, m.descripcion)) : []),
    [restaurant, query]
  );

  // Menús del día agrupados por Colección, con "Sin colección" como
  // bucket final para los que todavía no tienen una asignada (mismo
  // criterio que el fallback "Otros" de platos, más abajo).
  const menusByCollection = useMemo<MenuCollectionGroup[]>(() => {
    const withCollection = new Map<string, MenuCollectionGroup>();
    const sinColeccion: PublicMenuDelDia[] = [];

    for (const menu of filteredMenus) {
      if (menu.menu_colecciones) {
        const key = String(menu.menu_colecciones.id);
        if (!withCollection.has(key)) {
          withCollection.set(key, {
            id: key,
            nombre: menu.menu_colecciones.nombre,
            orden: menu.menu_colecciones.orden,
            menus: [],
          });
        }
        withCollection.get(key)!.menus.push(menu);
      } else {
        sinColeccion.push(menu);
      }
    }

    const groups = Array.from(withCollection.values()).sort((a, b) => a.orden - b.orden);

    if (sinColeccion.length > 0) {
      groups.push({ id: "sin-coleccion", nombre: "Sin colección", orden: Infinity, menus: sinColeccion });
    }

    return groups;
  }, [filteredMenus]);

  const filteredPromos = useMemo(
    () => (restaurant ? restaurant.promociones.filter((p) => matchesQuery(p.titulo, p.descripcion)) : []),
    [restaurant, query]
  );

  // Mismo agrupado por categoría de siempre, pero filtrando los platos
  // por el buscador ANTES de agrupar, y descartando categorías que se
  // queden sin ningún plato que matchee.
  const filteredPlatosByCategory = useMemo(
    () =>
      platosByCategory
        .map((group) => ({ ...group, platos: group.platos.filter((p) => matchesQuery(p.nombre, p.descripcion)) }))
        .filter((group) => group.platos.length > 0),
    [platosByCategory, query]
  );

  const filteredPlatosSinCategoria = useMemo(
    () => platosSinCategoria.filter((p) => matchesQuery(p.nombre, p.descripcion)),
    [platosSinCategoria, query]
  );

  // El dueño en "Vista previa" también puede tocar las cards para ver el
  // detalle exacto que ve un comensal (antes esto no navegaba a ningún
  // lado) -- lo único que se sigue evitando en ownerPreview es el botón
  // "Realizar pedido" de esa pantalla, vía el param ownerPreview.
  function goToProduct(productId: number, tipo: "menu_dia" | "plato" | "promocion") {
    router.push({
      pathname: "/(home)/pedido-producto",
      params: {
        id: productId,
        tipo,
        ofreceDelivery: ofreceDelivery ?? "",
        nombreDelivery: nombreDelivery ?? "",
        ownerPreview: String(isOwnerPreview),
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="cloud-offline-outline" size={36} color={colors.placeholder} />
        <Text style={styles.errorText}>{error || "No se pudo cargar el menú."}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const TABS: { key: CatalogTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "menu", label: "Menú", icon: "restaurant-outline" },
    { key: "platos", label: "Platos", icon: "fast-food-outline" },
    { key: "promos", label: "Promos", icon: "pricetag-outline" },
    { key: "galeria", label: "Galería", icon: "images-outline" },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {nombre || restaurant.nombreComercial}
        </Text>
        <View style={styles.roundButton} />
      </SafeAreaView>

      <KeyboardAvoidingScreen>
      <View style={styles.segmentRow}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => changeTab(t.key)}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={active ? "#FFFFFF" : colors.textSecondary}
              />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Todo lo de acá abajo (buscador + contenido de la pestaña) vive
          dentro de esta zona con el PanResponder del swipe -- así deslizar
          en cualquier parte del contenido cambia de pestaña, sin competir
          con el segmentRow de arriba (los botones siguen siendo taps
          normales) ni con el scroll vertical de cada lista. */}
      <View style={{ flex: 1 }} {...swipePanResponder.panHandlers}>
      {(tab === "menu" || tab === "platos" || tab === "promos") && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              tab === "menu"
                ? "Buscar en el menú del día..."
                : tab === "platos"
                ? "Buscar platos..."
                : "Buscar promociones..."
            }
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {tab === "menu" && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {menusByCollection.length === 0 ? (
            <EmptyState
              mascot={require("../../assets/images/nene-pensando.png")}
              text={
                query
                  ? "No encontramos nada que coincida con tu búsqueda."
                  : "Este restaurante todavía no publicó su menú del día."
              }
            />
          ) : (
            menusByCollection.map((group) => (
              <View key={group.id} style={styles.categoryGroup}>
                <View style={styles.categoryHeaderRow}>
                  <View style={[styles.categoryIcon, styles.categoryIconPlaceholder]}>
                    <Ionicons name="albums-outline" size={16} color={colors.placeholder} />
                  </View>
                  <Text style={styles.categoryTitle}>{group.nombre}</Text>
                </View>
                {group.menus.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    colors={colors}
                    interactive
                    onPress={() => goToProduct(item.id, "menu_dia")}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {tab === "platos" && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredPlatosByCategory.length === 0 && filteredPlatosSinCategoria.length === 0 ? (
            <EmptyState
              mascot={require("../../assets/images/nene-pensando.png")}
              text={
                query
                  ? "No encontramos nada que coincida con tu búsqueda."
                  : "Este restaurante todavía no cargó platos."
              }
            />
          ) : (
            <>
              {filteredPlatosByCategory.map((group) => (
                <View key={group.id} style={styles.categoryGroup}>
                  <CategoryHeader group={group} colors={colors} />
                  {group.platos.map((plato) => (
                    <DishCard
                      key={plato.id}
                      item={plato}
                      colors={colors}
                      interactive
                      onPress={() => goToProduct(plato.id, "plato")}
                    />
                  ))}
                </View>
              ))}

              {filteredPlatosSinCategoria.length > 0 && (
                <View style={styles.categoryGroup}>
                  <View style={styles.categoryHeaderRow}>
                    <View style={[styles.categoryIcon, styles.categoryIconPlaceholder]}>
                      <Ionicons name="ellipsis-horizontal" size={16} color={colors.placeholder} />
                    </View>
                    <Text style={styles.categoryTitle}>Otros</Text>
                  </View>
                  {filteredPlatosSinCategoria.map((plato) => (
                    <DishCard
                      key={plato.id}
                      item={plato}
                      colors={colors}
                      interactive
                      onPress={() => goToProduct(plato.id, "plato")}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {tab === "promos" && (
        <FlatList
          data={filteredPromos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PromoCard
              item={item}
              colors={colors}
              interactive
              onPress={() => goToProduct(item.id, "promocion")}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              mascot={require("../../assets/images/nene-pensando.png")}
              text={
                query
                  ? "No encontramos nada que coincida con tu búsqueda."
                  : "Este restaurante todavía no tiene promociones activas."
              }
            />
          }
        />
      )}

      {tab === "galeria" && (
        <FlatList
          data={restaurant.galeria}
          keyExtractor={(item) => String(item.id)}
          numColumns={GALLERY_COLUMNS}
          columnWrapperStyle={{ gap: GALLERY_GAP }}
          contentContainerStyle={styles.galleryContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => setGalleryIndex(index)} activeOpacity={0.85}>
              <Image source={{ uri: item.url }} style={styles.galleryThumb} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              mascot={require("../../assets/images/nene-brazos-cruzados.png")}
              text="Este restaurante todavía no cargó fotos."
            />
          }
        />
      )}
      </View>
      </KeyboardAvoidingScreen>

      <Modal
        visible={galleryIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGalleryIndex(null)}
      >
        <View style={styles.viewerBackdrop}>
          <SafeAreaView style={styles.viewerHeader} edges={["top"]}>
            <TouchableOpacity style={styles.viewerCloseButton} onPress={() => setGalleryIndex(null)}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {galleryIndex !== null && (
            <FlatList
              data={restaurant.galeria}
              keyExtractor={(item) => String(item.id)}
              horizontal
              pagingEnabled
              initialScrollIndex={galleryIndex}
              getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={{ width: SCREEN_W, alignItems: "center", justifyContent: "center" }}>
                  <Image source={{ uri: item.url }} style={styles.viewerImage} resizeMode="contain" />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ==========================================================================
// Subcomponentes
// ==========================================================================

function MenuCard({
  item,
  colors,
  interactive,
  onPress,
}: {
  item: PublicMenuDelDia;
  colors: ThemeColors;
  interactive: boolean;
  onPress: () => void;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={interactive ? 0.85 : 1}
      onPress={onPress}
    >
      {item.foto_url ? (
        <Image source={{ uri: item.foto_url }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={22} color={colors.placeholder} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.productTopRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.nombre}
          </Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${item.precio.toFixed(2)}</Text>
          </View>
        </View>
        {item.descripcion ? (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.descripcion}
          </Text>
        ) : null}
      </View>
      {interactive && <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />}
    </TouchableOpacity>
  );
}

function DishCard({
  item,
  colors,
  interactive,
  onPress,
}: {
  item: PublicDish;
  colors: ThemeColors;
  interactive: boolean;
  onPress: () => void;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={interactive ? 0.85 : 1}
      onPress={onPress}
    >
      {item.plato_imagenes[0]?.url ? (
        <Image source={{ uri: item.plato_imagenes[0].url }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="fast-food-outline" size={22} color={colors.placeholder} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.productTopRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.nombre}
          </Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${item.precio.toFixed(2)}</Text>
          </View>
        </View>
        {item.descripcion ? (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.descripcion}
          </Text>
        ) : null}
      </View>
      {interactive && <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />}
    </TouchableOpacity>
  );
}

function PromoCard({
  item,
  colors,
  interactive,
  onPress,
}: {
  item: PublicPromotion;
  colors: ThemeColors;
  interactive: boolean;
  onPress: () => void;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.promoCard}
      activeOpacity={interactive ? 0.9 : 1}
      onPress={onPress}
    >
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.promoImage} />
      ) : (
        <View style={[styles.promoImage, styles.promoImagePlaceholder]}>
          <Ionicons name="pricetag-outline" size={34} color={colors.placeholder} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.promoOverlay}
      >
        <View style={styles.promoBottomRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle} numberOfLines={1}>
              {item.titulo}
            </Text>
            {item.descripcion ? (
              <Text style={styles.promoDescription} numberOfLines={2}>
                {item.descripcion}
              </Text>
            ) : null}
          </View>
          <View style={styles.promoPriceBadge}>
            <Text style={styles.promoPriceText}>${item.precio.toFixed(2)}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function CategoryHeader({ group, colors }: { group: PlatoCategoryGroup; colors: ThemeColors }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const localIcon = getCategoryIcon(group.nombre);
  return (
    <View style={styles.categoryHeaderRow}>
      {localIcon ? (
        <Image source={localIcon} style={styles.categoryIcon} />
      ) : group.iconoUrl ? (
        <Image source={{ uri: group.iconoUrl }} style={styles.categoryIcon} />
      ) : (
        <View style={[styles.categoryIcon, styles.categoryIconPlaceholder]}>
          <Ionicons name="restaurant-outline" size={16} color={colors.placeholder} />
        </View>
      )}
      <Text style={styles.categoryTitle}>{group.nombre}</Text>
    </View>
  );
}

// ==========================================================================
// Estilos
// ==========================================================================

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 10,
    paddingHorizontal: 30,
  },
  errorText: { textAlign: "center", color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  errorButton: {
    marginTop: 4,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  errorButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  roundButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "800", color: colors.text, marginHorizontal: 8 },

  // Tab bar premium estilo "segmented control" de iOS.
  segmentRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentActive: {
    backgroundColor: "#FB8C00",
    shadowColor: "#FB8C00",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontSize: 11.5, fontWeight: "700", color: colors.textSecondary },
  segmentTextActive: { color: "#FFFFFF" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: colors.text },

  listContent: { padding: 16, paddingBottom: 140 },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  productImage: { width: 68, height: 68, borderRadius: 14 },
  productImagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  productTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  productName: { flex: 1, fontSize: 14.5, fontWeight: "800", color: colors.text },
  productDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  priceBadge: { backgroundColor: "#FFA726", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  priceBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

  categoryGroup: { marginBottom: 18 },
  categoryHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  categoryIcon: { width: 34, height: 34, borderRadius: 10 },
  categoryIconPlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  categoryTitle: { fontSize: 15.5, fontWeight: "900", color: colors.text },

  // Cards de promociones: grandes y llamativas, imagen de fondo con
  // degradado para que el texto/precio se lean sobre cualquier foto.
  promoCard: {
    height: 190,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: colors.surfaceSecondary,
  },
  promoImage: { width: "100%", height: "100%" },
  promoImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  promoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 14,
  },
  promoBottomRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  promoTitle: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  promoDescription: { fontSize: 12.5, color: "rgba(255,255,255,0.88)", marginTop: 3, lineHeight: 17 },
  promoPriceBadge: { backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  promoPriceText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },

  galleryContent: { padding: 16, paddingBottom: 140, gap: GALLERY_GAP },
  galleryThumb: { width: GALLERY_THUMB, height: GALLERY_THUMB, borderRadius: 12, marginBottom: GALLERY_GAP, backgroundColor: colors.surfaceSecondary },

  // El visor a pantalla completa se queda siempre oscuro a propósito
  // (mismo criterio que restaurant-gallery.tsx).
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  viewerHeader: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16 },
  viewerCloseButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  viewerImage: { width: SCREEN_W - 32, height: "80%" },
});
