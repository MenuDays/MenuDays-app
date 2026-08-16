import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import OrderService, { DeliveryMethod, Order } from "../../services/order.service";
import { AppAlert } from "../components/common/AppAlert";
import { buildWhatsAppUrl } from "../../utils/whatsapp";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

const MEDIO_LABEL: Record<DeliveryMethod, string> = {
  delivery: "Delivery",
  retiro_presencial: "Retiro presencial",
};

const ESTADO_LABEL: Record<Order["pedido"]["estado"], string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};

export default function PedidoConfirmarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    productoId: string;
    tipo: string;
    medioEntrega: DeliveryMethod;
  }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const input = {
      ...(params.tipo === "plato" && { dishId: params.productoId }),
      ...(params.tipo === "menu_dia" && { menuId: params.productoId }),
      ...(params.tipo === "promocion" && { promotionId: params.productoId }),
      medioEntrega: params.medioEntrega,
    };

    OrderService.create(input)
      .then(setOrder)
      .catch((e: any) => AppAlert.alert("Error", e.message || "No se pudo generar el pedido."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFinalizar() {
    if (!order) return;

    if (!order.restaurante.whatsapp) {
      AppAlert.alert("Sin WhatsApp", "El restaurante todavía no cargó un número de WhatsApp.");
      return;
    }

    const mensaje = order.mensajeWhatsapp ?? buildFallbackMessage(order);
    Linking.openURL(buildWhatsAppUrl(order.restaurante.whatsapp, mensaje));
  }

  if (loading || !order) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Info del pedido</Text>

          {/* TODO(back): sacar este fallback cuando Belén agregue
              codigoUnico a los serializers de order.service.ts (back).
              La columna pedidos.codigo_unico ya existe en la base, solo
              falta que algún endpoint la devuelva. Mientras tanto se
              muestra el id del pedido como referencia. */}
          <InfoRow label="Código" value={order.codigoUnico ? `#${order.codigoUnico}` : `#${order.id}`} />
          <InfoRow label="Restaurante" value={order.restaurante.nombre} />
          <InfoRow label="Producto" value={order.producto.nombre} />
          <InfoRow label="Medio de entrega" value={MEDIO_LABEL[order.pedido.medioEntrega]} />
          <InfoRow label="Estado" value={ESTADO_LABEL[order.pedido.estado]} />
          <InfoRow label="Total" value={`$${order.pedido.total.toFixed(2)}`} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleFinalizar}>
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.ctaText}>Finalizar contactando a WSP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// Respaldo por si "mensajeWhatsapp" viene null (ej. falló el fetch a
// GET /orders/:id/whatsapp-summary). El back ya arma este texto de
// verdad en ese endpoint (buildWhatsAppSummary), así que en el flujo
// normal esto casi no debería usarse.
function buildFallbackMessage(order: Order): string {
  const codigo = order.codigoUnico ?? order.id;
  return (
    `Hola! Quiero confirmar mi pedido #${codigo} de ${order.restaurante.nombre}.\n` +
    `Producto: ${order.producto.nombre}\n` +
    `Medio de entrega: ${MEDIO_LABEL[order.pedido.medioEntrega]}\n` +
    `Total: $${order.pedido.total.toFixed(2)}`
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, padding: 20 },
  card: {
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  infoValue: { fontSize: 13, color: colors.text, fontWeight: "700" },
  footer: {
    padding: 20,
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
});
