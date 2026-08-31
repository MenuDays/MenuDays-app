import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  OrderDetail,
  OrderItemType,
  BackendDeliveryMethod,
} from "../../services/order.service";
import RestaurantService from "../../services/restaurant.service";
import { optimizedImageUri } from "../../utils/imageUrl";
import { useOrderDetail } from "../../hooks/useOrderDetail";
import OrderStatusTracker from "../components/orders/OrderStatusTracker";
import { AppAlert } from "../components/common/AppAlert";
import { buildWhatsAppUrl } from "../../utils/whatsapp";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Vista de SOLO LECTURA para el comensal: acá no hay ningún control para
// cambiar el estado del pedido (eso es exclusivo del lado restaurante,
// ver GET/PATCH /orders/restaurant/:id en el backend).
//
// El estado se SINCRONIZA solo: useOrderDetail hace polling del endpoint
// GET /orders/:id mientras esta pantalla está enfocada y la app en primer
// plano, y se detiene cuando el pedido llega a un estado final.

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

// El mensaje de WhatsApp acá es DISTINTO al de pedido-confirmar.tsx: ese
// usa GET /orders/:id/whatsapp-summary, que arma un texto tipo "Quisiera
// realizar el siguiente pedido..." pensado para cuando el pedido recién
// se está armando. Acá el pedido YA existe (puede estar entregado,
// rechazado, en preparación, etc.), así que reusar ese mismo endpoint
// generaría un mensaje confuso. Por eso este mensaje se arma local.
function buildConsultaMessage(order: OrderDetail): string {
  const referencia = order.codigoUnico ? `código ${order.codigoUnico}` : `pedido #${order.id}`;
  return [
    `Hola, soy ${order.usuario.nombre}.`,
    "",
    `Tengo una consulta sobre mi ${referencia} (${order.producto.nombre}).`,
  ].join("\n");
}

export default function PedidoDetalleScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const { order, loading, error, refetch, refreshing, isLive } = useOrderDetail(id);

  const [restaurantPhone, setRestaurantPhone] = useState<string | null>(null);

  // Esta pantalla vive en el <Stack> de app/(home)/_layout.tsx, fuera de
  // <Tabs> -- solo se compensa el inset real de abajo.
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  // Teléfono del restaurante -- se pide UNA vez por restaurante (no va en
  // el polling; no cambia).
  useEffect(() => {
    if (!order?.restaurante.id) return;
    let cancelled = false;
    RestaurantService.getPublicDetail(order.restaurante.id)
      .then((r) => {
        if (!cancelled) setRestaurantPhone(r.telefonos[0]?.telefono ?? null);
      })
      .catch(() => {
        if (!cancelled) setRestaurantPhone(null);
      });
    return () => {
      cancelled = true;
    };
  }, [order?.restaurante.id]);

  async function handleContactar() {
    if (!order) return;
    if (!restaurantPhone) {
      AppAlert.alert("Sin contacto", "Este restaurante todavía no cargó un teléfono de contacto.");
      return;
    }
    Linking.openURL(buildWhatsAppUrl(restaurantPhone, buildConsultaMessage(order))).catch(() => {
      AppAlert.alert("No se pudo abrir WhatsApp", "Verificá que tengas WhatsApp instalado.");
    });
  }

  function handleVerRestaurante() {
    if (!order) return;
    router.push(`/(home)/restaurante-detalle?id=${order.restaurante.id}`);
  }

  function handleDejarResena() {
    if (!order) return;
    router.push({
      pathname: "/(home)/crear-resena",
      params: {
        pedidoId: order.id,
        restauranteNombre: order.restaurante.nombre,
        productoNombre: order.producto.nombre,
      },
    });
  }

  // Primera carga (sin ningún dato todavía).
  if (loading && !order) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  // Error solo si NO hay ningún dato para mostrar (si ya hay `order`, el
  // error es un aviso suave arriba y la pantalla sigue usable).
  if (!order) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="cloud-offline-outline" size={36} color={colors.placeholder} />
        <Text style={styles.errorText}>{error || "No se pudo cargar el pedido."}</Text>
        <View style={styles.errorButtonsRow}>
          <TouchableOpacity style={styles.errorButtonOutline} onPress={refetch}>
            <Text style={styles.errorButtonOutlineText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isEntregado = order.pedido.estado === "entregado";
  const footerButtons = isEntregado ? 2 : 1;
  const scrollBottomPadding = bottomInset + 34 + footerButtons * 58;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor="#FB8C00" />
        }
      >
        <View style={styles.coverWrap}>
          {order.restaurante.portada ? (
            <Image
              source={{ uri: optimizedImageUri(order.restaurante.portada, "cover") }}
              style={styles.cover}
            />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="receipt-outline" size={32} color={colors.placeholder} />
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
              <Image
                source={{ uri: optimizedImageUri(order.producto.imagen, "thumb") }}
                style={styles.productImage}
              />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons name="restaurant-outline" size={20} color={colors.placeholder} />
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

          {/* Código del pedido + aviso de sincronización. */}
          <View style={styles.codeRow}>
            <View style={styles.codeChip}>
              <Ionicons name="pricetag-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.codeChipText}>
                {order.codigoUnico ? `#${order.codigoUnico}` : `Pedido #${order.id}`}
              </Text>
            </View>
            {isLive ? (
              <View style={styles.liveChip}>
                {error ? (
                  <>
                    <Ionicons name="cloud-offline-outline" size={11} color={colors.placeholder} />
                    <Text style={styles.liveChipTextMuted}>Sin conexión, reintentando…</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveChipText}>En vivo</Text>
                  </>
                )}
              </View>
            ) : null}
          </View>

          {/* ---------- Estado del pedido (lo más visible) + línea de tiempo ---------- */}
          <View style={styles.trackerWrap}>
            <OrderStatusTracker estado={order.pedido.estado} historial={order.historial} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="receipt-outline" size={18} color="#FB8C00" />
              <Text style={styles.sectionTitle}>Detalle del pedido</Text>
            </View>

            <InfoRow icon="pricetag-outline" label="Tipo" value={TIPO_LABEL[order.pedido.tipo]} />
            <InfoRow
              icon={ENTREGA_ICON[order.pedido.metodoEntrega]}
              label="Entrega"
              value={ENTREGA_LABEL[order.pedido.metodoEntrega]}
            />
            <InfoRow icon="calendar-outline" label="Fecha" value={formatDateTime(order.pedido.fecha)} />
            <InfoRow
              icon="fast-food-outline"
              label="Precio del producto"
              value={`$${Number(order.producto.precio).toFixed(2)}`}
            />
            <InfoRow
              icon="cash-outline"
              label="Total"
              value={`$${Number(order.pedido.total).toFixed(2)}${
                order.pedido.metodoEntrega === "DELIVERY" ? " + cargos de envío" : ""
              }`}
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

      <View style={[styles.footer, { paddingBottom: 20 + bottomInset }]}>
        {isEntregado && (
          <TouchableOpacity style={styles.ctaSecondary} onPress={handleDejarResena}>
            <Ionicons name="star-outline" size={18} color="#FB8C00" />
            <Text style={styles.ctaSecondaryText}>Dejar reseña</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cta} onPress={handleContactar}>
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.ctaText}>Contactar al restaurante</Text>
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelWrap}>
        <Ionicons name={icon} size={15} color={colors.textSecondary} />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenSolid },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.screenSolid,
    paddingHorizontal: 30,
  },
  errorText: {
    marginTop: 10,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  errorButtonsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  errorButton: { backgroundColor: "#FB8C00", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  errorButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  errorButtonOutline: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: "#FB8C00",
  },
  errorButtonOutlineText: { color: "#FB8C00", fontSize: 13, fontWeight: "700" },

  coverWrap: { height: 160, backgroundColor: colors.surfaceSecondary },
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
    borderColor: colors.surface,
    backgroundColor: colors.card,
  },
  productImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 17, fontWeight: "900", color: colors.text },
  restaurantLink: { fontSize: 13, fontWeight: "700", color: "#FB8C00", marginTop: 2 },

  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 8,
  },
  codeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  codeChipText: { fontSize: 11.5, fontWeight: "800", color: colors.textSecondary, letterSpacing: 0.3 },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#2FB966" },
  liveChipText: { fontSize: 11, fontWeight: "700", color: "#2FB966" },
  liveChipTextMuted: { fontSize: 10.5, fontWeight: "600", color: colors.placeholder },

  trackerWrap: { marginTop: 16 },

  statusRow: { marginTop: 18 },

  section: { marginTop: 24 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  paragraph: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  infoValue: { fontSize: 13, color: colors.text, fontWeight: "700" },
  totalValue: { fontSize: 15, color: "#FB8C00", fontWeight: "900" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
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
  ctaSecondary: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaSecondaryText: { color: "#FB8C00", fontWeight: "800", fontSize: 14 },
});
