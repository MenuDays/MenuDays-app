import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import OrderService, { OrderDetail, OrderStatus } from "../../services/order.service";
import StatusBadge, { StatusTone } from "../components/restaurant/StatusBadge";
import { AppAlert } from "../components/common/AppAlert";

const ESTADO_LABEL: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};

const ESTADO_TONE: Record<OrderStatus, StatusTone> = {
  pendiente: "warning",
  aceptado: "info",
  preparando: "info",
  listo: "success",
  entregado: "success",
  rechazado: "danger",
  cancelado: "danger",
};

export default function PedidosScreen() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    OrderService.getHistory()
      .then(setOrders)
      .catch((e: any) => AppAlert.alert("Error", e.message || "No se pudieron cargar tus pedidos."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Pedidos</Text>

      {orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={36} color="#D9D9D9" />
          <Text style={styles.emptyText}>Todavía no tenés pedidos.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/(home)/pedido-detalle?id=${order.id}`)}
            >
              {order.producto.imagen ? (
                <Image source={{ uri: order.producto.imagen }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name="restaurant-outline" size={18} color="#BDBDBD" />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {order.producto.nombre}
                  </Text>
                  <StatusBadge
                    label={ESTADO_LABEL[order.pedido.estado]}
                    tone={ESTADO_TONE[order.pedido.estado]}
                  />
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {order.restaurante.nombre}
                </Text>
                <Text style={styles.cardPrice}>${order.pedido.total.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", padding: 16 },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  title: { fontSize: 24, fontWeight: "bold", color: "#3E2723" },

  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 13,
  },

  list: { paddingTop: 16, paddingBottom: 120 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  image: { width: 60, height: 60, borderRadius: 12 },
  imagePlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: "#1A1A1A" },
  cardSubtitle: { fontSize: 12, color: "#9E9E9E", marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: "800", color: "#FB8C00", marginTop: 6 },
});