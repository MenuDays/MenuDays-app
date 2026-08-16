import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import PublicMenuService from "../../services/public-menu.service";
import PublicDishService from "../../services/public-dish.service";
import PublicPromotionService from "../../services/public-promotion.service";
import { OrderItemType } from "../../services/order.service";

// Conectado a GET /public/menus/:id, GET /public/dishes/:id y
// GET /public/promotions/:id (PublicMenuService / PublicDishService /
// PublicPromotionService), según el "tipo" que llegue por params.
//
// Se llega acá desde:
// - restaurante-detalle.tsx: botón "Pedir" de Menú del día / Platos /
//   Promociones, con params { id, tipo }.
// - explorar-resultados.tsx: tap en una card de Platos/Menús/
//   Promociones, con params { id, tipo }.
//
// Los tres endpoints devuelven shapes distintos (nombre vs. titulo,
// foto_url vs. imagen_url vs. plato_imagenes[]), así que acá se
// normalizan a un único "producto" para que el JSX no tenga que
// ramificar en todos lados.

interface ProductoNormalizado {
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  restauranteNombre: string;
}

export default function PedidoProductoScreen() {
  const params = useLocalSearchParams<{
    id: string;
    tipo: OrderItemType;
    // Compatibilidad con el link viejo de menús del día
    // (menuId/restauranteId), por si queda algún router.push sin
    // actualizar en el proyecto.
    menuId?: string;
    // Vienen de restaurante-detalle.tsx (que ya tiene el restaurante
    // completo cargado) para saber si mostrar "Delivery" como medio de
    // entrega en pedido-entrega.tsx. Si se llega por otro camino (ej.
    // explorar-resultados.tsx) y no vienen, esa pantalla cae a mostrar
    // ambas opciones como antes.
    ofreceDelivery?: string;
    nombreDelivery?: string;
  }>();

  const productId = params.id ?? params.menuId;
  const tipo: OrderItemType = params.tipo ?? "menu_dia";

  const [producto, setProducto] = useState<ProductoNormalizado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Esta pantalla vive dentro del stack de tabs "(home)", cuya tab bar
  // flota con position "absolute" (ver styles.tabBar en _layout.tsx:
  // height 74 + bottom 18+insets.bottom). Al ser absoluta, no reserva
  // espacio real en el layout, así que el footer con el CTA "Realizar
  // pedido" queda tapado por la barra si no le sumamos ese alto a mano.
  const insets = useSafeAreaInsets();
  const tabBarSpace = 74 + 18 + insets.bottom;

  useEffect(() => {
    // Reseteo antes de cada fetch: si el intento anterior falló (ej.
    // "el producto ya no está disponible") y el usuario vuelve y entra
    // a otro producto válido, sin este reset el "error" viejo seguía
    // marcado y la pantalla mostraba ese error aunque el nuevo fetch
    // trajera el producto bien (el chequeo de abajo es `error || !producto`).
    setLoading(true);
    setError(null);
    setProducto(null);

    if (!productId) {
      setError("No se especificó qué producto mostrar.");
      setLoading(false);
      return;
    }

    let request: Promise<ProductoNormalizado>;

    if (tipo === "plato") {
      request = PublicDishService.findOne(productId).then((dish) => ({
        nombre: dish.nombre,
        descripcion: dish.descripcion,
        precio: dish.precio,
        imagenUrl: dish.plato_imagenes[0]?.url ?? null,
        restauranteNombre: dish.restaurante.nombre_comercial,
      }));
    } else if (tipo === "promocion") {
      request = PublicPromotionService.findOne(productId).then((promo) => ({
        nombre: promo.titulo,
        descripcion: promo.descripcion,
        precio: promo.precio,
        imagenUrl: promo.imagen_url,
        restauranteNombre: promo.restaurante.nombre_comercial,
      }));
    } else {
      request = PublicMenuService.findOne(productId).then((menu) => ({
        nombre: menu.nombre,
        descripcion: menu.descripcion,
        precio: menu.precio,
        imagenUrl: menu.foto_url,
        restauranteNombre: menu.restaurante.nombre_comercial,
      }));
    }

    request
      .then(setProducto)
      .catch((e: any) => setError(e.message || "No se pudo cargar el producto."))
      .finally(() => setLoading(false));
  }, [productId, tipo]);

  function handleRealizarPedido() {
    if (!producto || !productId) return;
    router.push({
      pathname: "/(home)/pedido-entrega",
      params: {
        productoId: productId,
        tipo,
        ofreceDelivery: params.ofreceDelivery,
        nombreDelivery: params.nombreDelivery,
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

  if (error || !producto) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#3E2723" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={36} color="#D9D9D9" />
          <Text style={styles.errorText}>{error || "No se pudo cargar el producto."}</Text>
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
          {producto.imagenUrl ? (
            <Image source={{ uri: producto.imagenUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="restaurant-outline" size={32} color="#BDBDBD" />
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

      <View style={[styles.footer, { paddingBottom: 20 + tabBarSpace }]}>
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