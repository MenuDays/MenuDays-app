import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import CategoryService, { Category } from "../../services/category.service";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Tab "Explorar": grilla de categorías. Al tocar una, se navega a
// explorar-resultados.tsx (buscador + filtros completos), precargada
// con esa categoría.
//
// Conectado a GET /categories (CategoryService del back). El ícono de
// cada categoría viene de item.iconos.url; si una categoría todavía
// no tiene ícono cargado, se usa un ícono genérico de Ionicons como
// fallback.

export default function ExplorarCategoriasScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  function handleSelectCategory(category: Category) {
    router.push({
      pathname: "/(home)/explorar-resultados",
      params: { categoria: category.nombre, categoriaId: String(category.id) },
    });
  }

  return (
    <ImageBackground
      source={require("../../assets/images/explorar-bg.png")}
      style={styles.gradient}
      resizeMode="cover"
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
            ListEmptyComponent={
              <View style={styles.centerWrap}>
                <Text style={styles.errorText}>Todavía no hay categorías cargadas.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                activeOpacity={0.85}
                onPress={() => handleSelectCategory(item)}
              >
                <View style={styles.iconCircle}>
                  {item.iconos?.url ? (
                    <Image
                      source={{ uri: item.iconos.url }}
                      style={styles.iconImage}
                    />
                  ) : (
                    <Ionicons name="restaurant-outline" size={26} color={colors.primaryDark} />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  // Título/error/retry viven directo sobre la foto de fondo (fija, no
  // cambia con el tema), así que se quedan en blanco en los dos modos.
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 14,
  },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30 },
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
  // Estos sí siguen el tema: son "cards" flotando sobre la foto, deben
  // sentirse en sintonía con el resto de la app en Dark Mode.
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  iconImage: { width: "100%", height: "100%", resizeMode: "cover" },
  labelPill: {
    marginTop: -10,
    backgroundColor: colors.card,
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
  labelText: { fontSize: 11, fontWeight: "700", color: colors.text, textAlign: "center" },
});
