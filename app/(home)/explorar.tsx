import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image, ImageBackground } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import CategoryService, { Category } from "../../services/category.service";
import { EmptyState } from "../components/common/EmptyState";
import { getCategoryIcon } from "../../constants/categoryIcons";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

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
    }
  }

  function handleSelectCategory(category: string) {
    router.push({
      pathname: "/(home)/explorar-resultados",
      params: { categoria: category },
    });
  }

  return (
    <ImageBackground
      source={require("../../assets/images/explorar-bg.png")}
      style={styles.gradient}
      contentFit="cover"
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>Explorar por categoría</Text>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : error ? (
          <View style={styles.centerWrap}>
            <Ionicons name="cloud-offline-outline" size={36} color="#FFFFFF" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <EmptyState
                  mascot={require("../../assets/images/nene-brazos-cruzados.png")}
                  text="Todavía no hay categorías cargadas."
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