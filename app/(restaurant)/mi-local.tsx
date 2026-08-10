import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RestauranteDetalleScreen from "../(home)/restaurante-detalle";

import OrderService, {
  NEXT_ORDER_STATUSES,
  OrderStatus,
  RestaurantOrderListItem,
} from "../../services/order.service";
import RestaurantService from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import StatusBadge, { StatusTone } from "../components/restaurant/StatusBadge";

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

export default function MiLocalScreen() {
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
  const [estadoFilter, setEstadoFilter] = useState<OrderStatus | "todos">("todos");
  const [orders, setOrders] = useState<RestaurantOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guarda qué pedido tiene su selector de "siguiente estado" abierto,
  // para no armar un modal aparte -- alcanza con expandir la card.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const data = await OrderService.getRestaurantOrders(
        estadoFilter !== "todos" ? { estado: estadoFilter } : {}
      );
      setOrders(data);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [estadoFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  function handleRefresh() {
    setRefreshing(true);
    fetchOrders();
  }

  async function handleAdvance(orderId: string, nuevoEstado: OrderStatus) {
    setUpdatingId(orderId);
    try {
      await OrderService.updateStatus(orderId, nuevoEstado);
      setExpandedId(null);
      fetchOrders();
    } catch (e: any) {
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
          <Ionicons name="cloud-offline-outline" size={36} color="#D9D9D9" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
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
              <Ionicons name="receipt-outline" size={36} color="#D9D9D9" />
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
                    <Image source={{ uri: item.imagen }} style={styles.orderImage} />
                  ) : (
                    <View style={[styles.orderImage, styles.orderImagePlaceholder]}>
                      <Ionicons name="fast-food-outline" size={20} color="#BDBDBD" />
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
                      color="#9E9E9E"
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
                        {nextOptions.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={styles.optionChip}
                            onPress={() => handleAdvance(item.id, option)}
                          >
                            <Text style={styles.optionChipText}>{ESTADO_LABEL[option]}</Text>
                          </TouchableOpacity>
                        ))}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAFAFA" },
  tabContent: { flex: 1 },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: "#F0F0F0",
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
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: "700", color: "#9E9E9E" },
  tabLabelActive: { color: "#3E2723" },

  filterListWrapper: { flexGrow: 0, marginTop: 14 },
  filterList: { gap: 8, paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  filterChipActive: { backgroundColor: "#FB8C00", borderColor: "#FB8C00" },
  filterChipText: { fontSize: 12, fontWeight: "700", color: "#3E2723" },
  filterChipTextActive: { color: "#FFFFFF" },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30 },
  retryButton: { marginTop: 4, backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  emptyWrap: { alignItems: "center", marginTop: 60, paddingHorizontal: 30, gap: 10 },
  emptyText: { textAlign: "center", color: "#9E9E9E", fontSize: 13, lineHeight: 19 },

  ordersList: { padding: 16, paddingBottom: 140, gap: 12 },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderImage: { width: 46, height: 46, borderRadius: 10 },
  orderImagePlaceholder: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  orderProduct: { fontSize: 14, fontWeight: "800", color: "#1A1A1A" },
  orderCustomer: { fontSize: 12, color: "#9E9E9E", marginTop: 1 },
  orderMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  orderMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderMetaText: { fontSize: 12, color: "#9E9E9E", fontWeight: "600" },
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
