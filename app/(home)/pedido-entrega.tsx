import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { DeliveryMethod } from "../../services/order.service";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

interface DeliveryOption {
  value: DeliveryMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  helper?: string;
}

export default function PedidoEntregaScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    productoId: string;
    tipo: string;
    // Vienen de pedido-producto.tsx (que a su vez los recibe de
    // restaurante-detalle.tsx). Si "ofreceDelivery" no vino (undefined,
    // ej. se llegó por un camino que no lo manda todavía), se muestran
    // las dos opciones como antes -- solo se OCULTA "Delivery" cuando
    // se sabe con certeza que el restaurante no lo ofrece.
    ofreceDelivery?: string;
    nombreDelivery?: string;
  }>();

  // El back rechaza el pedido (400) si se manda metodoEntrega=DELIVERY
  // para un restaurante sin delivery configurado (ver
  // validateDeliveryAvailability en OrderService del back) -- acá se
  // oculta esa opción de entrada para no dejar elegir algo que después
  // va a fallar.
  const deliveryDisponible = params.ofreceDelivery !== "false";

  const OPTIONS: DeliveryOption[] = [
    ...(deliveryDisponible
      ? [
          {
            value: "delivery" as DeliveryMethod,
            label: "Delivery",
            icon: "bicycle-outline" as const,
            helper: params.nombreDelivery ? `Repartidor: ${params.nombreDelivery}` : undefined,
          },
        ]
      : []),
    { value: "retiro_presencial" as DeliveryMethod, label: "Retiro presencial", icon: "storefront-outline" as const },
  ];

  const [selected, setSelected] = useState<DeliveryMethod>(deliveryDisponible ? "delivery" : "retiro_presencial");

  // Corregido (ver pedido-producto.tsx): esta pantalla vive en el
  // <Stack> de app/(home)/_layout.tsx, fuera de <Tabs> -- la tab bar
  // flotante no se renderiza acá, así que no hace falta compensar su
  // alto completo, solo el inset real de abajo (home indicator).
  const insets = useSafeAreaInsets();
  const tabBarSpace = insets.bottom;

  function handleContinuar() {
    router.push({
      pathname: "/(home)/pedido-confirmar",
      params: {
        productoId: params.productoId,
        tipo: params.tipo,
        medioEntrega: selected,
      },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image
          source={require("../../assets/images/delivery-nene.png")}
          style={styles.mascot}
          resizeMode="contain"
        />

        <Text style={styles.title}>Seleccionar medio de entrega:</Text>

        <View style={styles.optionsList}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setSelected(option.value)}
              >
                <Ionicons
                  name={isSelected ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={isSelected ? "#FB8C00" : colors.placeholder}
                />
                <Ionicons name={option.icon} size={20} color={colors.text} style={styles.optionIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {option.helper ? <Text style={styles.optionHelper}>{option.helper}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: 20 + tabBarSpace }]}>
        <TouchableOpacity style={styles.cta} onPress={handleContinuar}>
          <Text style={styles.ctaText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  mascot: { width: "100%", height: 160, alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 8, marginBottom: 24 },
  optionsList: { gap: 12 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  optionCardSelected: {
    borderColor: "#FB8C00",
    backgroundColor: colors.surfaceSecondary,
  },
  optionIcon: { marginRight: 2 },
  optionLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
  optionHelper: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cta: {
    backgroundColor: "#FFA726",
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});