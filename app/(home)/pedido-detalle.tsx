import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import OrderService, {
  OrderDetail,
  OrderItemType,
  OrderStatus,
  BackendDeliveryMethod,
} from "../../services/order.service";
import RestaurantService from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";
import StatusBadge, { StatusTone } from "../components/restaurant/StatusBadge";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

// Vista de SOLO LECTURA para el comensal: acá no hay ningún control para
// cambiar el estado del pedido (eso es exclusivo del lado restaurante,
// ver GET/PATCH /orders/restaurant/:id en el backend).

const ESTADO_LABEL: Record<OrderStatus, string> = {
  pendiente: "Pendiente de confirmación",
  aceptado: "Aceptado por el restaurante",
  preparando: "En preparación",
  listo: "Listo para retirar",
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

const TIPO_LABEL: Record<OrderItemType, string> = {
  plato: "Plato",
  menu_dia: "Menú del día",
  promocion: "Promoción",
};

const ENTREGA_LABEL: Record<BackendDeliveryMethod, string> = {
  DELIVERY: "Delivery a domicilio",
  RETIRO_EN_LOCAL: "Retiro en el local",
};

const ENTREGA_ICON: Record<BackendDeliveryMethod, keyof typeof Ionicons.glyphMap> = {
  DELIVERY: "bicycle-outline",
  RETIRO_EN_LOCAL: "storefront-outline",
};

export default function PedidoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [restaurantPhone, setRestaurantPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    setRestaurantPhone(null);
    OrderService.getById(id)
      .then((data) => {
        setOrder(data);
        // El detalle del pedido no trae el teléfono del restaurante, así
        // que se pide aparte (mismo endpoint público que usa
        // restaurante-detalle.tsx) solo para armar el botón de WhatsApp.
        return RestaurantService.getPublicDetail(data.restaurante.id)
          .then((r) => setRestaurantPhone(r.telefonos[0]?.telefono ?? null))
          .catch(() => setRestaurantPhone(null));
      })
      .catch((e: any) => {
        const msg = e.message || "No se pudo cargar el pedido.";
        setError(msg);
        AppAlert.alert("Error", msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleContactar() {
    if (!order) return;
    if (!restaurantPhone) {
      AppAlert.alert("Sin contacto", "Este restaurante todavía no cargó un teléfono de contacto.");
      return;
    }
    setContactLoading(true);
    try {
      const { mensajeWhatsapp } = await OrderService.getWhatsAppSummary(order.id);
      Linking.openURL(buildWhatsAppUrl(restaurantPhone, mensajeWhatsapp));
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo generar el mensaje.");
    } finally {
      setContactLoading(false);
    }
  }

  function handleVerRestaurante() {
    if (!order) return;
    router.push(`/(home)/restaurante-detalle?id=${order.restaurante.id}`);
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="cloud-offline-outline" size={36} color="#D9D9D9" />
        <Text style={{ marginTop: 10, textAlign: "center", color: "#9E9E9E", fontSize: 13, lineHeight: 19, paddingHorizontal: 30 }}>
          {error || "No se pudo cargar el pedido."}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 14, backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.coverWrap}>
          {order.restaurante.portada ? (
            <Image source={{ uri: order.restaurante.portada }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="receipt-outline" size={32} color="#C9C9C9" />
            </View>
          )}

          <SafeAreaView style={styles.coverOverlay} edges={["top"]}>
            <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="#3E2723" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            {order.producto.imagen ? (
              <Image source={{ uri: order.producto.imagen }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons name="restaurant-outline" size={20} color="#BDBDBD" />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.productName} numberOfLines={2}>
                {order.producto.nombre}
              </Text>
              <TouchableOpacity onPress={handleVerRestaurante}>
                <Text style={styles.restaurantLink} numberOfLines={1}>
                  {order.restaurante.nombre}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statusRow}>
            <StatusBadge label={ESTADO_LABEL[order.pedido.estado]} tone={ESTADO_TONE[order.pedido.estado]} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="receipt-outline" size={18} color="#FB8C00" />
              <Text style={styles.sectionTitle}>Detalle del pedido</Text>
            </View>

            <InfoRow
              icon="pricetag-outline"
              label="Tipo"
              value={TIPO_LABEL[order.pedido.tipo]}
            />
            <InfoRow
              icon={ENTREGA_ICON[order.pedido.metodoEntrega]}
              label="Entrega"
              value={ENTREGA_LABEL[order.pedido.metodoEntrega]}
            />
            <InfoRow
              icon="calendar-outline"
              label="Fecha"
              value={formatDateTime(order.pedido.fecha)}
            />
            <InfoRow
              icon="cash-outline"
              label="Total"
              value={`$${order.pedido.total.toFixed(2)}`}
              valueStyle={styles.totalValue}
            />
          </View>

          {order.pedido.observaciones ? (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color="#FB8C00" />
                <Text style={styles.sectionTitle}>Observaciones</Text>
              </View>
              <Text style={styles.paragraph}>{order.pedido.observaciones}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, contactLoading && { opacity: 0.7 }]}
          onPress={handleContactar}
          disabled={contactLoading}
        >
          {contactLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.ctaText}>Contactar al restaurante</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelWrap}>
        <Ionicons name={icon} size={15} color="#9E9E9E" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },

  coverWrap: { height: 160, backgroundColor: "#F5F5F5" },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  content: { padding: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: -44 },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  productImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 17, fontWeight: "900", color: "#1A1A1A" },
  restaurantLink: { fontSize: 13, fontWeight: "700", color: "#FB8C00", marginTop: 2 },

  statusRow: { marginTop: 18 },

  section: { marginTop: 24 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  paragraph: { fontSize: 13, color: "#5C5C5C", lineHeight: 20 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoLabel: { fontSize: 13, color: "#9E9E9E", fontWeight: "600" },
  infoValue: { fontSize: 13, color: "#1A1A1A", fontWeight: "700" },
  totalValue: { fontSize: 15, color: "#FB8C00", fontWeight: "900" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cta: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
});