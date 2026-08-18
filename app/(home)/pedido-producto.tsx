import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import PublicMenuService from "../../services/public-menu.service";
import PublicDishService from "../../services/public-dish.service";
import PublicPromotionService from "../../services/public-promotion.service";
import { OrderItemType } from "../../services/order.service";
import ImageViewerModal from "../components/common/ImageViewerModal";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

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
  restauranteId: string;
  restauranteNombre: string;
  // Sólo menús del día y promociones tienen vigencia (fecha_fin); los
  // platos no, así que queda null para tipo === "plato".
  fechaFin: string | null;
}

// fechaFin viene como "YYYY-MM-DD" (columna @db.Date, sin hora). Se fuerza
// timeZone "UTC" al formatear para no correr el día según la zona horaria
// del dispositivo (si no, un device con offset negativo podría mostrar el
// día anterior al guardado).
function formatFechaFin(fechaFin: string): string {
  const date = new Date(`${fechaFin}T00:00:00.000Z`);
  const formatted = date.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return `Disponible hasta el ${formatted}`;
}

export default function PedidoProductoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    // Viene en "true" cuando se llega desde la Vista previa del dueño
    // (restaurante-catalogo.tsx con ownerPreview) -- ahí se puede ver el
    // detalle igual que un comensal, pero no tiene sentido dejarlo
    // "pedirse a sí mismo", así que se esconde el CTA de pedido.
    ownerPreview?: string;
  }>();

  const productId = params.id ?? params.menuId;
  const tipo: OrderItemType = params.tipo ?? "menu_dia";
  const isOwnerPreview = params.ownerPreview === "true";

  const [producto, setProducto] = useState<ProductoNormalizado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

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
        restauranteId: dish.restaurante.id,
        restauranteNombre: dish.restaurante.nombre_comercial,
        fechaFin: null,
      }));
    } else if (tipo === "promocion") {
      request = PublicPromotionService.findOne(productId).then((promo) => ({
        nombre: promo.titulo,
        descripcion: promo.descripcion,
        precio: promo.precio,
        imagenUrl: promo.imagen_url,
        restauranteId: promo.restaurante.id,
        restauranteNombre: promo.restaurante.nombre_comercial,
        fechaFin: promo.fecha_fin,
      }));
    } else {
      request = PublicMenuService.findOne(productId).then((menu) => ({
        nombre: menu.nombre,
        descripcion: menu.descripcion,
        precio: menu.precio,
        imagenUrl: menu.foto_url,
        restauranteId: menu.restaurante.id,
        restauranteNombre: menu.restaurante.nombre_comercial,
        fechaFin: menu.fecha_fin,
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

  function handleVerRestaurante() {
    if (!producto) return;
    router.push({
      pathname: "/(home)/restaurante-detalle",
      params: { id: producto.restauranteId },
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.imageWrap}
          activeOpacity={producto.imagenUrl ? 0.9 : 1}
          disabled={!producto.imagenUrl}
          onPress={() => setImageViewerVisible(true)}
        >
          {producto.imagenUrl ? (
            <Image source={{ uri: producto.imagenUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="restaurant-outline" size={32} color={colors.placeholder} />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.restaurante}>{producto.restauranteNombre}</Text>
        <View style={styles.topRow}>
          <Text style={styles.nombre}>{producto.nombre}</Text>
          <Text style={styles.precio}>${producto.precio.toFixed(2)}</Text>
        </View>
        {producto.descripcion ? <Text style={styles.descripcion}>{producto.descripcion}</Text> : null}
        {producto.fechaFin ? (
          <View style={styles.vigenciaRow}>
            <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.vigenciaText}>{formatFechaFin(producto.fechaFin)}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + tabBarSpace }]}>
        {!isOwnerPreview && (
          <TouchableOpacity style={styles.cta} onPress={handleRealizarPedido}>
            <Text style={styles.ctaText}>Realizar pedido</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.verRestauranteButton} onPress={handleVerRestaurante}>
          <Ionicons name="storefront-outline" size={17} color="#FB8C00" />
          <Text style={styles.verRestauranteText}>Ver restaurante</Text>
        </TouchableOpacity>
      </View>

      {producto.imagenUrl && (
        <ImageViewerModal
          visible={imageViewerVisible}
          images={[{ uri: producto.imagenUrl, label: producto.nombre }]}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30, backgroundColor: colors.background },
  errorText: { textAlign: "center", color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  retryButton: { marginTop: 4, backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
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
  precio: { fontSize: 18, fontWeight: "800", color: "#FB8C00" },
  descripcion: { fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
  vigenciaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  vigenciaText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cta: {
    backgroundColor: "#FFA726",
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  verRestauranteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    marginTop: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#FFA726",
  },
  verRestauranteText: { color: "#FB8C00", fontWeight: "800", fontSize: 14 },
});