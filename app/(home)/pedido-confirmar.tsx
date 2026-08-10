import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Misma razón que en pedido-producto.tsx y pedido-entrega.tsx: esta
  // pantalla está dentro del stack de tabs "(home)", cuya tab bar
  // flota con position "absolute" y no reserva espacio real, así que
  // el footer con "Finalizar contactando a WSP" queda tapado si no le
  // sumamos ese alto a mano.
  const insets = useSafeAreaInsets();
  const tabBarSpace = 74 + 18 + insets.bottom;

  useEffect(() => {
    // Reseteo el estado antes de cada intento: esta pantalla es parte
    // del Tabs navigator de (home) (con href: null), así que React
    // Navigation la mantiene montada -- si el usuario vuelve atrás y
    // reintenta con otro medioEntrega (ej. después de un error de
    // "el restaurante no tiene delivery"), este efecto se re-ejecuta
    // por el cambio de params, pero sin este reset se seguía viendo
    // el error/loading de la request anterior hasta que la nueva
    // resolviera.
    setLoading(true);
    setErrorMsg(null);
    setOrder(null);

    const input = {
      ...(params.tipo === "plato" && { dishId: params.productoId }),
      ...(params.tipo === "menu_dia" && { menuId: params.productoId }),
      ...(params.tipo === "promocion" && { promotionId: params.productoId }),
      medioEntrega: params.medioEntrega,
    };

    OrderService.create(input)
      .then(setOrder)
      .catch((e: any) => {
        const msg = e.message || "No se pudo generar el pedido.";
        setErrorMsg(msg);
        AppAlert.alert("Error", msg);
      })
      .finally(() => setLoading(false));
  }, [params.productoId, params.tipo, params.medioEntrega]);

  function handleFinalizar() {
    if (!order) return;

    if (!order.restaurante.whatsapp) {
      AppAlert.alert("Sin WhatsApp", "El restaurante todavía no cargó un número de WhatsApp.");
      return;
    }

    const mensaje = order.mensajeWhatsapp ?? buildFallbackMessage(order);
    Linking.openURL(buildWhatsAppUrl(order.restaurante.whatsapp, mensaje));
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#3E2723" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#E53935" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.errorRetryButton} onPress={() => router.back()}>
            <Text style={styles.errorRetryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !order) {
    return (
      <View style={styles.loaderContainer}>
        <Image
          source={require("../../assets/images/nene-pensando.png")}
          style={styles.loaderMascot}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#FB8C00" style={{ marginTop: 12 }} />
        <Text style={styles.loaderText}>Estamos armando tu pedido...</Text>
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
        <View style={styles.mascotWrap}>
          <Image
            source={require("../../assets/images/nene-thumbsup.png")}
            style={styles.mascotImage}
            resizeMode="contain"
          />
          <Text style={styles.mascotText}>¡Tu pedido fue generado con éxito!</Text>
        </View>

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

      <View style={[styles.footer, { paddingBottom: 20 + tabBarSpace }]}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  loaderMascot: { width: 140, height: 140 },
  loaderText: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#9E9E9E" },
  mascotWrap: { alignItems: "center", marginBottom: 12 },
  mascotImage: { width: 130, height: 130 },
  mascotText: { fontSize: 14, fontWeight: "800", color: "#1A1A1A", marginTop: 4, textAlign: "center" },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: { fontSize: 14, color: "#3E2723", textAlign: "center" },
  errorRetryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#F5A800",
  },
  errorRetryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
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