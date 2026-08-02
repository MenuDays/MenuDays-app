import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import OrderService, { DeliveryMethod, Order } from "../../services/order.service";
import { AppAlert } from "../components/common/AppAlert";
import { buildWhatsAppUrl } from "../../utils/whatsapp";

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
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#3E2723" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Info del pedido</Text>

          <InfoRow label="Código" value={`#${order.codigoUnico}`} />
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
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// TODO(back): esto es un respaldo por si "mensajeWhatsapp" viene null.
// Lo ideal es que este texto lo arme y guarde el back en el create()
// (ver comentario en order.service.ts) para que quede un registro de qué
// se mandó; esto de acá quedaría solo como fallback.
function buildFallbackMessage(order: Order): string {
  return (
    `Hola! Quiero confirmar mi pedido #${order.codigoUnico} de ${order.restaurante.nombre}.\n` +
    `Producto: ${order.producto.nombre}\n` +
    `Medio de entrega: ${MEDIO_LABEL[order.pedido.medioEntrega]}\n` +
    `Total: $${order.pedido.total.toFixed(2)}`
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  header: { paddingHorizontal: 16, paddingTop: 4 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, padding: 20 },
  card: {
    borderWidth: 1.5,
    borderColor: "#FFD180",
    backgroundColor: "#FFF8EE",
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#1A1A1A", marginBottom: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE7C2",
  },
  infoLabel: { fontSize: 13, color: "#9E9E9E", fontWeight: "600" },
  infoValue: { fontSize: 13, color: "#1A1A1A", fontWeight: "700" },
  footer: {
    padding: 20,
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
