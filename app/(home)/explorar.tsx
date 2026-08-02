import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Tab "Explorar": grilla de categorías. Al tocar una, se navega a
// explorar-resultados.tsx (buscador + filtros completos), precargada
// con esa categoría.
//
// Solo 5 categorías tienen ilustración propia en assets/images (las
// mismas que ya usa el carrusel de Inicio); el resto usa un ícono de
// Ionicons como fallback hasta que existan las ilustraciones.

interface Category {
  name: string;
  image?: any;
  icon?: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: Category[] = [
  { name: "Ejecutivo", image: require("../../assets/images/ejecutivo.png") },
  { name: "Mariscos", image: require("../../assets/images/mariscos.png") },
  { name: "Parrillas", image: require("../../assets/images/parrillas.png") },
  { name: "Sopas", image: require("../../assets/images/sopas.png") },
  { name: "Pollo", image: require("../../assets/images/pollo.png") },
  { name: "Cevicherías", icon: "fish-outline" },
  { name: "Comida Típica", icon: "restaurant-outline" },
  { name: "Hamburguesas", icon: "fast-food-outline" },
  { name: "Pizzas", icon: "pizza-outline" },
  { name: "Pastas", icon: "restaurant-outline" },
  { name: "Sushi", icon: "fish-outline" },
  { name: "Comida China", icon: "restaurant-outline" },
  { name: "Mexicana", icon: "restaurant-outline" },
  { name: "Sándwiches", icon: "fast-food-outline" },
  { name: "Comida Rápida", icon: "fast-food-outline" },
  { name: "Desayunos", icon: "cafe-outline" },
  { name: "Cafetería", icon: "cafe-outline" },
  { name: "Postres", icon: "ice-cream-outline" },
  { name: "Heladería", icon: "ice-cream-outline" },
  { name: "Bebidas", icon: "wine-outline" },
  { name: "Bares", icon: "beer-outline" },
  { name: "Vegana", icon: "leaf-outline" },
  { name: "Ensaladas", icon: "leaf-outline" },
  { name: "Postres Saludables", icon: "nutrition-outline" },
  { name: "Panadería", icon: "restaurant-outline" },
  { name: "Empanadas", icon: "restaurant-outline" },
  { name: "Bolones", icon: "restaurant-outline" },
];

export default function ExplorarCategoriasScreen() {
  function handleSelectCategory(category: string) {
    router.push({
      pathname: "/(home)/explorar-resultados",
      params: { categoria: category },
    });
  }

  return (
    <LinearGradient colors={["#FFB74D", "#FB8C00"]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>Explorar por categoría</Text>

        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.name}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.85}
              onPress={() => handleSelectCategory(item.name)}
            >
              <View style={styles.iconCircle}>
                {item.image ? (
                  <Image source={item.image} style={styles.iconImage} />
                ) : (
                  <Ionicons name={item.icon!} size={26} color="#FB8C00" />
                )}
              </View>
              <View style={styles.labelPill}>
                <Text style={styles.labelText} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
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
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  iconImage: { width: 56, height: 56, borderRadius: 28 },
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