import React, { useCallback, useMemo, useRef, useState } from "react";
import { AppState, View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, RefreshControl, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import OrderService, { OrderHistoryItem, OrderStatus } from "../../../services/order.service";
import { optimizedImageUri } from "../../../utils/imageUrl";
import { EmptyState } from "../../components/common/EmptyState";
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
  // La mascota escala con la pantalla: chica en un iPhone SE, generosa
  // en un Pro Max / tablet, sin pasarse.
  const { width: screenWidth } = useWindowDimensions();
  const mascotSize = Math.round(Math.min(240, Math.max(150, screenWidth * 0.5)));

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const inFlight = useRef(false);

  const loadOrders = useCallback(
    async (opts?: { silent?: boolean; manual?: boolean }) => {
      if (inFlight.current) return;
      inFlight.current = true;
      if (opts?.manual) setRefreshing(true);
      try {
        const data = await OrderService.getHistory();
        setOrders(data);
      } catch (e: any) {
        // Refresco silencioso (polling): no molestar con un alert, se
        // conserva lo último cargado y se reintenta en el próximo tick.
        if (!opts?.silent) {
          AppAlert.alert("Error", e.message || "No se pudieron cargar tus pedidos.");
        }
      } finally {
        inFlight.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Refresca al enfocar la pestaña + polling suave (20s) mientras está
  // activa y en primer plano -> así los cambios de estado del restaurante
  // aparecen en la lista sin cerrar la app. Se limpia al salir de la tab.
  useFocusEffect(
    useCallback(() => {
      void loadOrders();

      let interval: ReturnType<typeof setInterval> | null = null;
      const start = () => {
        if (interval) return;
        interval = setInterval(() => {
          if (AppState.currentState === "active") void loadOrders({ silent: true });
        }, 20000);
      };
      const stop = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };
      start();

      const sub = AppState.addEventListener("change", (s) => {
        if (s === "active") {
          void loadOrders({ silent: true });
          start();
        } else {
          stop();
        }
      });

      return () => {
        stop();
        sub.remove();
      };
    }, [loadOrders])
  );

  function handleRefresh() {
    void loadOrders({ manual: true });
  }

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
        // "Pibe pensativo" (nene-pensando.png, PNG con transparencia -> se
        // ve bien en claro y oscuro), centrado y responsive vía EmptyState.
        <EmptyState
          mascot={require("../../../assets/images/nene-pensando.png")}
          size={mascotSize}
          text={"No hay más pedidos por ahora.\nCuando hagas uno, va a aparecer aquí."}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
        >
          {orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/(home)/pedido-detalle?id=${order.id}`)}
            >
              {order.imagen ? (
                <Image source={{ uri: optimizedImageUri(order.imagen, "thumb") }} style={styles.image} />
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
