import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Image, ImageBackground } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import CategoryService, { Category } from "../../../services/category.service";
import PublicMenuService from "../../../services/public-menu.service";
import { EmptyState } from "../../components/common/EmptyState";
import { getCategoryIcon } from "../../../constants/categoryIcons";

// Perf: expo-image (ya es dependencia del proyecto) decodifica más rápido
// que el <Image> de react-native y cachea en memoria+disco -- importa acá
// solo el fondo y los íconos de categoría. Los íconos locales, además,
// venían pesando ~1.6MB cada uno a 1024x1024 (se mostraban en un círculo
// de 72pt) -- reducidos a 256px máx en assets/images/categorias/, que
// alcanza de sobra incluso a 3x de densidad de píxeles.
const BLURHASH_PLACEHOLDER = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

// Tab "Explorar": grilla de categorías. Al tocar una, se navega a
// explorar-resultados.tsx (buscador + filtros completos), precargada
// con esa categoría.
//
// Conectado a GET /categories (CategoryService del back). El ícono de
// cada categoría viene de item.iconos.url; si una categoría todavía
// no tiene ícono cargado, se usa un ícono genérico de Ionicons como
// fallback.

export default function ExplorarCategoriasScreen() {
  // La mascota del banner escala con el ancho de pantalla (antes 148 fijo,
  // se veía chica en pantallas grandes y desproporcionada en las chicas).
  const { width: screenWidth } = useWindowDimensions();
  const mascotSize = Math.round(Math.min(240, Math.max(150, screenWidth * 0.46)));
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Palabras clave (tags) que algún restaurante cargó en un menú y
  // matchean lo que se está buscando -- ver PublicMenuService.findMatchingTags.
  const [matchingTags, setMatchingTags] = useState<string[]>([]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((c) => c.nombre.toLowerCase().includes(query));
  }, [categories, search]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Debounce: busca tags que coincidan mientras el usuario escribe (ej.
  // "carnes" -> tags de menús que restaurantes cargaron con esa palabra),
  // para poder llevarlo directo a esos menús sin pasar por una categoría.
  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) {
      setMatchingTags([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const tags = await PublicMenuService.findMatchingTags(query);
        if (active) setMatchingTags(tags);
      } catch {
        if (active) setMatchingTags([]);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  async function loadCategories() {
    setLoading(true);
    setError(null);
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadCategories();
  }

  function handleSelectCategory(category: string) {
    router.push({
      pathname: "/(home)/explorar-resultados",
      params: { categoria: category },
    });
  }

  function handleSelectTag(tag: string) {
    router.push({
      pathname: "/(home)/explorar-resultados",
      params: { tag },
    });
  }

  return (
    <ImageBackground
      source={require("../../../assets/images/explorar-bg.png")}
      style={styles.gradient}
      contentFit="cover"
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {loading ? (
          <>
            <Text style={styles.title}>Explorar por categoría</Text>
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          </>
        ) : error ? (
          <>
            <Text style={styles.title}>Explorar por categoría</Text>
            <View style={styles.centerWrap}>
              <Ionicons name="cloud-offline-outline" size={36} color="#FFFFFF" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
            // Header scrolleable -- antes el título/mascota/buscador
            // quedaban fijos arriba (fuera del FlatList) y solo la
            // grilla de categorías se movía; ahora todo baja junto.
            ListHeaderComponent={
              <>
                <Text style={styles.title}>Explorar por categoría</Text>

                {/* Cartelito de bienvenida con la mascota -- aparece
                    siempre que se entra a Explorar, para darle un toque
                    más cálido/personal a la pantalla. */}
                <View style={styles.mascotBanner}>
                  <View style={styles.mascotBubble}>
                    <Text style={styles.mascotBubbleText}>¿Qué comemos hoy?</Text>
                    <Text style={styles.mascotBubbleSubtext}>
                      Elige una categoría para empezar
                    </Text>
                  </View>
                  <Image
                    source={require("../../../assets/images/ninaExplorer.png")}
                    style={[styles.mascotBannerImage, { width: mascotSize, height: mascotSize }]}
                    contentFit="contain"
                  />
                </View>

                {categories.length > 0 && (
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#9E9E9E" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Buscar categoría..."
                      placeholderTextColor="#9E9E9E"
                      value={search}
                      onChangeText={setSearch}
                      returnKeyType="search"
                    />
                    {search.length > 0 && (
                      <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color="#9E9E9E" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Palabras clave (tags) que coinciden con la búsqueda --
                    ej. si escribe "carnes", muestra los tags que
                    restaurantes cargaron en sus menús que contienen esa
                    palabra. Al tocar uno, lleva directo a esos menús. */}
                {matchingTags.length > 0 && (
                  <View style={styles.tagsSection}>
                    <Text style={styles.tagsSectionTitle}>Palabras clave</Text>
                    <View style={styles.tagsWrap}>
                      {matchingTags.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={styles.tagChip}
                          activeOpacity={0.85}
                          onPress={() => handleSelectTag(tag)}
                        >
                          <Ionicons name="pricetag-outline" size={13} color="#FB8C00" />
                          <Text style={styles.tagChipText}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <EmptyState
                  mascot={require("../../../assets/images/nene-brazos-cruzados.png")}
                  text={
                    search
                      ? "No encontramos categorías con ese nombre."
                      : "Todavía no hay categorías cargadas."
                  }
                  size={120}
                />
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                activeOpacity={0.85}
                onPress={() => handleSelectCategory(item.nombre)}
              >
                <View style={styles.iconCircle}>
                  {getCategoryIcon(item.nombre) ? (
                    <Image
                      source={getCategoryIcon(item.nombre)!}
                      style={styles.iconImage}
                      contentFit="cover"
                      cachePolicy="memory"
                    />
                  ) : item.iconos?.url ? (
                    <Image
                      source={{ uri: item.iconos.url }}
                      style={styles.iconImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
                      transition={150}
                    />
                  ) : (
                    <Ionicons name="restaurant-outline" size={26} color="#FB8C00" />
                  )}
                </View>
                <View style={styles.labelPill}>
                  <Text style={styles.labelText} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#3E2723" },
  // Cartelito con la mascota -- burbuja de texto a la izquierda, mascota
  // a la derecha, con un ligero solape para que se lea como "la nena
  // está hablando" en vez de dos elementos sueltos.
  mascotBanner: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  mascotBubble: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: -6,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  mascotBubbleText: { fontSize: 16, fontWeight: "800", color: "#3E2723" },
  mascotBubbleSubtext: { fontSize: 12, color: "#9E9E9E", marginTop: 2, fontWeight: "500" },
  // Bien grande -- antes (96x96) quedaba casi invisible contra el
  // fondo con textura de la pantalla.
  mascotBannerImage: { width: 148, height: 148 },
  tagsSection: { marginTop: -8, marginBottom: 16 },
  tagsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    opacity: 0.9,
  },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tagChipText: { fontSize: 12, fontWeight: "700", color: "#3E2723" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30 },
  emptyCard: {
    marginTop: 40,
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  errorText: { textAlign: "center", color: "#FFFFFF", fontSize: 13, lineHeight: 19 },
  retryButton: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: { color: "#FB8C00", fontSize: 13, fontWeight: "700" },
  // paddingBottom: solo para que la última fila no quede tapada por la
  // tab bar flotante.
  grid: { paddingBottom: 110 },
  row: { justifyContent: "space-between", marginBottom: 22 },
  item: { width: "31%", alignItems: "center" },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  iconImage: { width: "100%", height: "100%" },
  labelPill: {
    marginTop: -10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  labelText: { fontSize: 11, fontWeight: "700", color: "#3E2723", textAlign: "center" },
});