import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import PublicMenuService from "../../services/public-menu.service";
import PublicDishService from "../../services/public-dish.service";
import PublicPromotionService from "../../services/public-promotion.service";
import { OrderItemType } from "../../services/order.service";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Conectado a GET /public/menus/:id, /public/dishes/:id y
// /public/promotions/:id según el `tipo` que llega por params (mismo
// valor que después viaja a pedido-entrega.tsx -> pedido-confirmar.tsx
// -> OrderService.create, que ya soporta los 3 tipos). El botón "Pedir"
// que llega acá vive en restaurante-detalle.tsx, en las 3 secciones
// (Menú del día / Platos / Promociones).

// Forma común a la que se normalizan los 3 tipos de producto, para
// compartir una sola UI (igual criterio que explorar-resultados.tsx).
interface ProductoDetalle {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  restauranteNombre: string;
}

async function fetchProducto(tipo: OrderItemType, id: string): Promise<ProductoDetalle> {
  if (tipo === "menu_dia") {
    const m = await PublicMenuService.findOne(id);
    return {
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion,
      precio: m.precio,
      imagenUrl: m.foto_url,
      restauranteNombre: m.restaurante.nombre_comercial,
    };
  }
  if (tipo === "plato") {
    const d = await PublicDishService.findOne(id);
    return {
      id: d.id,
      nombre: d.nombre,
      descripcion: d.descripcion,
      precio: d.precio,
      imagenUrl: d.plato_imagenes?.[0]?.url ?? null,
      restauranteNombre: d.restaurante.nombre_comercial,
    };
  }
  const p = await PublicPromotionService.findOne(id);
  return {
    id: p.id,
    nombre: p.titulo,
    descripcion: p.descripcion,
    precio: p.precio,
    imagenUrl: p.imagen_url,
    restauranteNombre: p.restaurante.nombre_comercial,
  };
}

export default function PedidoProductoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ productoId: string; tipo: OrderItemType }>();

  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.productoId || !params.tipo) {
      setError("No se especificó qué producto mostrar.");
      setLoading(false);
      return;
    }
    fetchProducto(params.tipo, params.productoId)
      .then(setProducto)
      .catch((e: any) => setError(e.message || "No se pudo cargar el producto."))
      .finally(() => setLoading(false));
  }, [params.tipo, params.productoId]);

  function handleRealizarPedido() {
    if (!producto) return;
    router.push({
      pathname: "/(home)/pedido-entrega",
      params: {
        productoId: producto.id,
        tipo: params.tipo,
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  if (error || !producto) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.placeholder} />
          <Text style={styles.errorText}>{error || "No se pudo cargar el producto."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          {producto.imagenUrl ? (
            <Image source={{ uri: producto.imagenUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="restaurant-outline" size={32} color={colors.placeholder} />
            </View>
          )}
        </View>

        <Text style={styles.restaurante}>{producto.restauranteNombre}</Text>
        <View style={styles.topRow}>
          <Text style={styles.nombre}>{producto.nombre}</Text>
          <Text style={styles.precio}>${producto.precio.toFixed(2)}</Text>
        </View>
        {producto.descripcion ? <Text style={styles.descripcion}>{producto.descripcion}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleRealizarPedido}>
          <Text style={styles.ctaText}>Realizar pedido</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30, backgroundColor: colors.background },
  errorText: { textAlign: "center", color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  retryButton: { marginTop: 4, backgroundColor: colors.primaryDark, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, paddingBottom: 24 },
  imageWrap: { height: 220, borderRadius: 20, overflow: "hidden", marginBottom: 18 },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  restaurante: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 4 },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  nombre: { flex: 1, fontSize: 22, fontWeight: "900", color: colors.text },
  precio: { fontSize: 18, fontWeight: "800", color: colors.primaryDark },
  descripcion: { fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});
