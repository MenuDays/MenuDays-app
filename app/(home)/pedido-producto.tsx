import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { MOCK_PEDIDO_PRODUCTO } from "./mockPedidoProducto";

// TODO: mock a propósito (a pedido, sin conexión a backend todavía).
// Ver mockPedidoProducto.ts para el detalle de qué reemplazar.

export default function PedidoProductoScreen() {
  const producto = MOCK_PEDIDO_PRODUCTO;

  function handleRealizarPedido() {
    router.push({
      pathname: "/(home)/pedido-entrega",
      params: {
        productoId: producto.id,
        tipo: producto.tipo,
      },
    });
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
          <Image source={{ uri: producto.imagen }} style={styles.image} />
        </View>

        <Text style={styles.restaurante}>{producto.restaurante}</Text>
        <View style={styles.topRow}>
          <Text style={styles.nombre}>{producto.nombre}</Text>
          <Text style={styles.precio}>${producto.precio.toFixed(2)}</Text>
        </View>
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
  restaurante: { fontSize: 13, fontWeight: "700", color: "#9E9E9E", marginBottom: 4 },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  nombre: { flex: 1, fontSize: 22, fontWeight: "900", color: "#1A1A1A" },
  precio: { fontSize: 18, fontWeight: "800", color: "#FB8C00" },
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
