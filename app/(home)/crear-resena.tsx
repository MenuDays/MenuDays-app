import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ReviewService from "../../services/review.service";
import { AppAlert } from "../components/common/AppAlert";
import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Se llega acá desde pedido-detalle.tsx, botón "Dejar reseña" (solo
// visible cuando order.pedido.estado === "entregado"). Pega contra
// POST /reviews (ver review.service.ts) mandando el pedidoId -- el back
// es quien valida que el pedido esté entregado, sea del usuario y no
// tenga ya una reseña, así que esos casos se muestran tal cual vengan
// en e.message en vez de duplicar la validación acá.

export default function CrearResenaScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { pedidoId, restauranteNombre, productoNombre } = useLocalSearchParams<{
    pedidoId: string;
    restauranteNombre?: string;
    productoNombre?: string;
  }>();

  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const insets = useSafeAreaInsets();

  async function handleEnviar() {
    if (!pedidoId) return;
    if (calificacion === 0) {
      AppAlert.alert("Falta la calificación", "Elegí de 1 a 5 estrellas antes de enviar.");
      return;
    }
    setSubmitting(true);
    try {
      await ReviewService.create({ pedidoId, calificacion, comentario });
      AppAlert.alert("¡Gracias!", "Tu reseña fue publicada.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      AppAlert.alert("No se pudo enviar", e.message || "Intentá de nuevo en unos minutos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dejar reseña</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingScreen>
        <View style={styles.content}>
          {(restauranteNombre || productoNombre) && (
            <View style={styles.summaryCard}>
              {restauranteNombre ? <Text style={styles.summaryRestaurant}>{restauranteNombre}</Text> : null}
              {productoNombre ? <Text style={styles.summaryProduct}>{productoNombre}</Text> : null}
            </View>
          )}

          <Text style={styles.label}>¿Cómo calificarías tu pedido?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setCalificacion(n)} hitSlop={8}>
                <Ionicons
                  name={n <= calificacion ? "star" : "star-outline"}
                  size={38}
                  color={n <= calificacion ? "#F5A800" : colors.border}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Comentario (opcional)</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            maxLength={1000}
            placeholder="Contanos cómo fue tu experiencia..."
            placeholderTextColor={colors.placeholder}
            value={comentario}
            onChangeText={setComentario}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.cta, submitting && { opacity: 0.7 }]}
            onPress={handleEnviar}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>Enviar reseña</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingScreen>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  content: { flex: 1, padding: 20 },
  summaryCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  summaryRestaurant: { fontSize: 13, fontWeight: "800", color: "#FB8C00" },
  summaryProduct: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  label: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 },
  starsRow: { flexDirection: "row", justifyContent: "center", marginBottom: 28 },
  textArea: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    minHeight: 110,
  },
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
