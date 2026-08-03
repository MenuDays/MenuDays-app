import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import PublicMenuService, { PublicMenuDetail } from "../../services/public-menu.service";

// Conectado a GET /public/menus/:id (PublicMenuController del back). Antes
// esta pantalla usaba MOCK_PEDIDO_PRODUCTO -- ver restaurante-detalle.tsx
// para el origen de menuId (botón "Pedir" de la card de Menú del día).
//
// Por ahora solo soporta menús del día (tipo "menu_dia"); cuando se
// conecten platos/promociones desde otras pantallas, agregar el mismo
// patrón con DishService.getById / PromotionService.getById según el
// tipo que llegue por params.

export default function PedidoProductoScreen() {
  const params = useLocalSearchParams<{ menuId: string; restauranteId?: string }>();

  const [menu, setMenu] = useState<PublicMenuDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.menuId) {
      setError("No se especificó qué menú mostrar.");
      setLoading(false);
      return;
    }
    PublicMenuService.findOne(params.menuId)
      .then(setMenu)
      .catch((e: any) => setError(e.message || "No se pudo cargar el menú."))
      .finally(() => setLoading(false));
  }, [params.menuId]);

  function handleRealizarPedido() {
    if (!menu) return;
    router.push({
      pathname: "/(home)/pedido-entrega",
      params: {
        productoId: menu.id,
        tipo: "menu_dia",
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  if (error || !menu) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#3E2723" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={36} color="#D9D9D9" />
          <Text style={styles.errorText}>{error || "No se pudo cargar el menú."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#3E2723" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          {menu.foto_url ? (
            <Image source={{ uri: menu.foto_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="restaurant-outline" size={32} color="#BDBDBD" />
            </View>
          )}
        </View>

        <Text style={styles.restaurante}>{menu.restaurante.nombre_comercial}</Text>
        <View style={styles.topRow}>
          <Text style={styles.nombre}>{menu.nombre}</Text>
          <Text style={styles.precio}>${menu.precio.toFixed(2)}</Text>
        </View>
        {menu.descripcion ? <Text style={styles.descripcion}>{menu.descripcion}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleRealizarPedido}>
          <Text style={styles.ctaText}>Realizar pedido</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30, backgroundColor: "#FFFFFF" },
  errorText: { textAlign: "center", color: "#9E9E9E", fontSize: 13, lineHeight: 19 },
  retryButton: { marginTop: 4, backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, paddingBottom: 24 },
  imageWrap: { height: 220, borderRadius: 20, overflow: "hidden", marginBottom: 18 },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  restaurante: { fontSize: 13, fontWeight: "700", color: "#9E9E9E", marginBottom: 4 },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  nombre: { flex: 1, fontSize: 22, fontWeight: "900", color: "#1A1A1A" },
  precio: { fontSize: 18, fontWeight: "800", color: "#FB8C00" },
  descripcion: { fontSize: 14, color: "#6B6B6B", marginTop: 10, lineHeight: 20 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cta: {
    backgroundColor: "#FFA726",
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});