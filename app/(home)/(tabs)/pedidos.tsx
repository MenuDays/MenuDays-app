import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import OrderService, { OrderHistoryItem, OrderStatus } from "../../../services/order.service";
import StatusBadge, { StatusTone } from "../../components/restaurant/StatusBadge";
import { AppAlert } from "../../components/common/AppAlert";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
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
          {/* pedidos-nene.png es un PNG sin canal alpha (fondo blanco
              sólido, no transparente) -- en Dark Mode se veía como un
              cuadrado blanco pegado. Se reemplaza por un ícono, igual
              criterio que el resto de los estados vacíos de la app. */}
          <Ionicons name="receipt-outline" size={64} color={colors.placeholder} />
          <Text style={styles.emptyText}>Todavía no tienes pedidos.</Text>
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
              {order.imagen ? (
                <Image source={{ uri: order.imagen }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name="restaurant-outline" size={18} color={colors.placeholder} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {order.nombre ?? "Producto eliminado"}
                  </Text>
                  <StatusBadge
                    label={ESTADO_LABEL[order.estado]}
                    tone={ESTADO_TONE[order.estado]}
                  />
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {order.restaurante.nombre}
                </Text>
                <Text style={styles.cardPrice}>
                  ${Number(order.total).toFixed(2)}
                  {order.metodoEntrega === "DELIVERY" && (
                    <Text style={styles.cardPriceExtra}> + cargos</Text>
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "bold", color: colors.text },

  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyMascot: {
    width: 160,
    height: 160,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
  },

  list: { paddingTop: 16, paddingBottom: 120 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  image: { width: 60, height: 60, borderRadius: 12 },
  imagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: "800", color: "#FB8C00", marginTop: 6 },
  cardPriceExtra: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
});
