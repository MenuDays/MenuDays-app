import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import RestauranteDetalleScreen from "../(home)/restaurante-detalle";

import OrderService, {
  NEXT_ORDER_STATUSES,
  OrderStatus,
  RestaurantOrderListItem,
} from "../../services/order.service";
import RestaurantService from "../../services/restaurant.service";
import { optimizedImageUri } from "../../utils/imageUrl";
import { AppAlert } from "../components/common/AppAlert";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import StatusBadge, { StatusTone } from "../components/restaurant/StatusBadge";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Pantalla "Mi Local": antes el ítem de la nav bar no llevaba a ningún
// lado (route: null en RestaurantBottomNav). Junta dos cosas:
// 1) Gestión de pedidos entrantes -- GET/PATCH /orders/restaurant*.
// 2) Vista previa de solo lectura de cómo ve el restaurante el
//    comensal -- GET /restaurants/:id (mismo endpoint que
//    restaurante-detalle.tsx del lado comensal), pero sin ninguno de
//    los botones de acción (Pedir, Cómo llegar, etc.), a propósito:
//    es solo para que el dueño vea "así me ven", no para operar desde
//    acá.

type Tab = "pedidos" | "vista_previa";

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
  cancelado: "neutral",
};

const ESTADO_FILTERS: (OrderStatus | "todos")[] = [
  "todos",
  "pendiente",
  "aceptado",
  "preparando",
  "listo",
  "entregado",
  "rechazado",
  "cancelado",
];

function isOrderStatus(v: string | undefined): v is OrderStatus {
  return (
    !!v &&
    (ESTADO_FILTERS as string[]).includes(v) &&
    v !== "todos"
  );
}

export default function MiLocalScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<Tab>("pedidos");

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Mi Local"
      showBack
      />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "pedidos" && styles.tabButtonActive]}
          onPress={() => setTab("pedidos")}
        >
          <Text style={[styles.tabLabel, tab === "pedidos" && styles.tabLabelActive]}>Pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "vista_previa" && styles.tabButtonActive]}
          onPress={() => setTab("vista_previa")}
        >
          <Text style={[styles.tabLabel, tab === "vista_previa" && styles.tabLabelActive]}>
            Vista previa
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "pedidos" ? <PedidosTab /> : <VistaPreviaTab />}

      <RestaurantBottomNav />
    </View>
  );
}

// ============================================================
// Tab: Pedidos
// ============================================================

function PedidosTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // El dashboard puede abrir esta pantalla ya filtrada por un estado
  // (card "Pedidos pendientes" -> ?estado=pendiente).
  const params = useLocalSearchParams<{ estado?: string }>();
  const [estadoFilter, setEstadoFilter] = useState<OrderStatus | "todos">(
    isOrderStatus(params.estado) ? params.estado : "todos"
  );
  const [orders, setOrders] = useState<RestaurantOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guarda qué pedido tiene su selector de "siguiente estado" abierto,
  // para no armar un modal aparte -- alcanza con expandir la card.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const inFlight = useRef(false);
  const estadoFilterRef = useRef(estadoFilter);
  estadoFilterRef.current = estadoFilter;

  const fetchOrders = useCallback(async (opts?: { silent?: boolean; manual?: boolean }) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (opts?.manual) setRefreshing(true);
    try {
      const filter = estadoFilterRef.current;
      const data = await OrderService.getRestaurantOrders(
        filter !== "todos" ? { estado: filter } : {}
      );
      // Ignorar la respuesta si el filtro cambió mientras cargaba.
      if (estadoFilterRef.current !== filter) return;
      setOrders(data);
      setError(null);
    } catch (e: any) {
      if (!opts?.silent) setError(e.message || "No se pudieron cargar los pedidos.");
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recargar al cambiar de filtro.
  useEffect(() => {
    setLoading(true);
    void fetchOrders();
  }, [estadoFilter, fetchOrders]);

  // Refrescar al enfocar la pantalla + polling suave mientras está activa
  // y en primer plano -> el restaurante ve los pedidos nuevos (y los
  // cambios) sin recargar a mano. Se limpia al salir.
  useFocusEffect(
    useCallback(() => {
      void fetchOrders({ silent: true });

      let interval: ReturnType<typeof setInterval> | null = null;
      const start = () => {
        if (interval) return;
        interval = setInterval(() => {
          if (AppState.currentState === "active") void fetchOrders({ silent: true });
        }, 15000);
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
          void fetchOrders({ silent: true });
          start();
        } else {
          stop();
        }
      });
      return () => {
        stop();
        sub.remove();
      };
    }, [fetchOrders])
  );

  function handleRefresh() {
    void fetchOrders({ manual: true });
  }

  async function handleAdvance(orderId: string, nuevoEstado: OrderStatus) {
    // No permitir doble envío: si ya hay un cambio en curso, ignorar.
    if (updatingId) return;
    setUpdatingId(orderId);
    try {
      await OrderService.updateStatus(orderId, nuevoEstado);
      setExpandedId(null);
      // Recargar para reflejar el estado real confirmado por el backend.
      await fetchOrders({ silent: true });
    } catch (e: any) {
      // El backend RECHAZÓ el cambio -> se mantiene el estado anterior
      // (no se recarga la lista, la card sigue como estaba) y se avisa.
      AppAlert.alert("No se pudo actualizar", e.message || "Intentá de nuevo en un momento.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <View style={styles.tabContent}>
      <FlatList
        horizontal
        style={styles.filterListWrapper}
        showsHorizontalScrollIndicator={false}
        data={ESTADO_FILTERS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const active = item === estadoFilter;
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setEstadoFilter(item)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {item === "todos" ? "Todos" : ESTADO_LABEL[item]}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#FB8C00" />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.placeholder} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); void fetchOrders(); }}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={36} color={colors.placeholder} />
              <Text style={styles.emptyText}>
                {estadoFilter === "todos"
                  ? "Todavía no te llegó ningún pedido."
                  : `No hay pedidos en estado "${ESTADO_LABEL[estadoFilter as OrderStatus]}".`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const nextOptions = NEXT_ORDER_STATUSES[item.estado];
            const isExpanded = expandedId === item.id;
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                  {item.imagen ? (
                    <Image source={{ uri: optimizedImageUri(item.imagen, "thumb") }} style={styles.orderImage} />
                  ) : (
                    <View style={[styles.orderImage, styles.orderImagePlaceholder]}>
                      <Ionicons name="fast-food-outline" size={20} color={colors.placeholder} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderProduct} numberOfLines={1}>
                      {item.nombre ?? "Producto"}
                    </Text>
                    <Text style={styles.orderCustomer} numberOfLines={1}>
                      {item.usuario.nombre}
                    </Text>
                  </View>
                  <StatusBadge label={ESTADO_LABEL[item.estado]} tone={ESTADO_TONE[item.estado]} />
                </View>

                <View style={styles.orderMetaRow}>
                  <View style={styles.orderMetaItem}>
                    <Ionicons
                      name={item.metodoEntrega === "DELIVERY" ? "bicycle-outline" : "storefront-outline"}
                      size={13}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.orderMetaText}>
                      {item.metodoEntrega === "DELIVERY" ? "Delivery" : "Retiro en el local"}
                    </Text>
                  </View>
                  <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
                </View>

                {nextOptions.length > 0 && (
                  <>
                    <TouchableOpacity
                      style={styles.advanceButton}
                      onPress={() => setExpandedId(isExpanded ? null : item.id)}
                      disabled={updatingId === item.id}
                    >
                      {updatingId === item.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.advanceButtonText}>Cambiar estado</Text>
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={15}
                            color="#FFFFFF"
                          />
                        </>
                      )}
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.optionsRow}>
                        {nextOptions.map((option) => {
                          const busy = updatingId !== null;
                          return (
                            <TouchableOpacity
                              key={option}
                              style={[styles.optionChip, busy && styles.optionChipDisabled]}
                              onPress={() => handleAdvance(item.id, option)}
                              disabled={busy}
                            >
                              <Text style={styles.optionChipText}>{ESTADO_LABEL[option]}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// ============================================================
// Tab: Vista previa (solo lectura, sin botones de acción -- es para
// que el dueño vea cómo lo ve el comensal, no para operar desde acá)
// ============================================================

function VistaPreviaTab() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    RestaurantService.getProfile()
      .then((me) => {
        setRestaurantId(String(me.id));
      })
      .catch((e: any) => {
        AppAlert.alert(
          "Error",
          e.message || "No se pudo cargar el restaurante."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !restaurantId) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  return (
    <RestauranteDetalleScreen
      previewRestaurantId={restaurantId}
      ownerPreview
    />
  );
}

const DAY_NAMES: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenSolid },
  tabContent: { flex: 1 },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  tabLabelActive: { color: colors.text },

  filterListWrapper: { flexGrow: 0, marginTop: 14 },
  filterList: { gap: 8, paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: "#FB8C00", borderColor: "#FB8C00" },
  filterChipText: { fontSize: 12, fontWeight: "700", color: colors.text },
  filterChipTextActive: { color: "#FFFFFF" },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30 },
  retryButton: { marginTop: 4, backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  emptyWrap: { alignItems: "center", marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyText: { textAlign: "center", color: colors.textSecondary, fontSize: 13, lineHeight: 19 },

  ordersList: { padding: 16, paddingBottom: 140, gap: 12 },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderImage: { width: 46, height: 46, borderRadius: 10 },
  orderImagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  orderProduct: { fontSize: 14, fontWeight: "800", color: colors.text },
  orderCustomer: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  orderMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  orderMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderMetaText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  orderTotal: { fontSize: 14, fontWeight: "800", color: "#FB8C00" },

  advanceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
    backgroundColor: "#3E2723",
    borderRadius: 10,
    paddingVertical: 8,
  },
  advanceButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFD9A0",
  },
  optionChipDisabled: { opacity: 0.45 },
  optionChipText: { fontSize: 12, fontWeight: "700", color: "#FB8C00" },

  previewContent: { paddingBottom: 140 },
  previewBanner: {
    backgroundColor: "#FFF3E0",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    padding: 12,
  },
  previewBannerText: { fontSize: 12, color: "#B26A00", lineHeight: 17, fontWeight: "600" },
  previewCover: { width: "100%", height: 150, marginTop: 14 },
  previewCoverPlaceholder: { backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  previewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: -28,
  },
  previewLogo: { width: 60, height: 60, borderRadius: 16, borderWidth: 3, borderColor: "#FFFFFF" },
  previewLogoPlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  previewName: { fontSize: 17, fontWeight: "900", color: "#1A1A1A", marginTop: 20 },
  previewRatingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  previewRatingText: { fontSize: 12, color: "#6B6B6B", fontWeight: "600" },

  previewSection: { paddingHorizontal: 16, marginTop: 20 },
  previewSectionTitle: { fontSize: 15, fontWeight: "800", color: "#1A1A1A", marginBottom: 10 },
  previewParagraph: { fontSize: 13, color: "#6B6B6B", lineHeight: 19 },

  previewMenuCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  previewMenuImage: { width: 44, height: 44, borderRadius: 10 },
  previewMenuImagePlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  previewMenuName: { fontSize: 13, fontWeight: "800", color: "#1A1A1A" },
  previewMenuDescription: { fontSize: 11, color: "#9E9E9E", marginTop: 1 },
  previewMenuPrice: { fontSize: 13, fontWeight: "800", color: "#FB8C00" },

  previewAddressRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 12 },
  previewAddressText: { flex: 1, fontSize: 13, color: "#6B6B6B", lineHeight: 18 },
  previewScheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  previewScheduleDay: { fontSize: 12, color: "#9E9E9E", fontWeight: "600" },
  previewScheduleHours: { fontSize: 12, color: "#1A1A1A", fontWeight: "700" },
  previewScheduleClosed: { fontSize: 12, color: "#E53935", fontWeight: "700" },
});
