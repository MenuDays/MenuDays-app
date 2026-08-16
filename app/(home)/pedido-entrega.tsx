import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { DeliveryMethod } from "../../services/order.service";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

interface DeliveryOption {
  value: DeliveryMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  // TODO: mock a propósito. El nombre del repartidor/delivery vendría
  // del back cuando exista un módulo de delivery asignado; por ahora
  // se muestra fijo como en el mockup ("delivery: {nombre}").
  helper?: string;
}

const OPTIONS: DeliveryOption[] = [
  { value: "delivery", label: "Delivery", icon: "bicycle-outline", helper: "Repartidor: a asignar" },
  { value: "retiro_presencial", label: "Retiro presencial", icon: "storefront-outline" },
];

export default function PedidoEntregaScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ productoId: string; tipo: string }>();
  const [selected, setSelected] = useState<DeliveryMethod>("delivery");

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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
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
                  color={isSelected ? colors.primaryDark : colors.placeholder}
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

      <View style={styles.footer}>
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
    borderColor: colors.primaryDark,
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
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});
