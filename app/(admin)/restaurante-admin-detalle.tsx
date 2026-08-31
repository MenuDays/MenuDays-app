import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RestaurantsAdminService, {
  AdminRestaurantDetail,
  RestaurantAccountStatus,
} from "../../services/restaurantsAdmin.service";
import { optimizedImageUri } from "../../utils/imageUrl";
import { AppAlert } from "../components/common/AppAlert";
import AdminBottomNav from "../components/admin/AdminBottomNav";
import InfoRow from "../components/admin/InfoRow";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

function getStatusInfo(status: RestaurantAccountStatus) {
  switch (status) {
    case "activo":
      return { label: "Activo", color: "#43A047", background: "#E8F5E9" };
    case "suspendido":
      return { label: "Suspendido", color: "#FB8C00", background: "#FFF3E0" };
    default:
      return { label: "Eliminado", color: "#E53935", background: "#FFEBEE" };
  }
}

export default function RestauranteAdminDetalleScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminRestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  function loadDetail() {
    if (!id) return;
    RestaurantsAdminService.getById(Number(id))
      .then(setDetail)
      .catch(() => AppAlert.alert("Error", "No se pudo cargar el restaurante."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    setLoading(true);
    loadDetail();
  }, [id]);

  function handleRefresh() {
    setRefreshing(true);
    loadDetail();
  }

  async function applyStatus(estado: RestaurantAccountStatus) {
    if (!detail) return;
    setActionLoading(true);
    try {
      await RestaurantsAdminService.updateStatus(detail.id, estado);
      setDetail((prev) => (prev ? { ...prev, estadoCuenta: estado } : prev));
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar el estado del restaurante.");
    } finally {
      setActionLoading(false);
    }
  }

  function confirmPause() {
    if (!detail) return;
    AppAlert.alert(
      "Pausar restaurante",
      `"${detail.nombreComercial}" dejará de ser visible para los comensales hasta que lo reactives.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Pausar", style: "destructive", onPress: () => applyStatus("suspendido") },
      ]
    );
  }

  function confirmReactivate() {
    if (!detail) return;
    AppAlert.alert(
      "Reactivar restaurante",
      `"${detail.nombreComercial}" volverá a estar visible para los comensales.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Reactivar", onPress: () => applyStatus("activo") },
      ]
    );
  }

  function confirmDelete() {
    if (!detail) return;
    AppAlert.alert(
      "Eliminar restaurante",
      "El restaurante dejará de estar disponible en MenuDays. Esta acción afectará su visibilidad en la aplicación.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => applyStatus("eliminado") },
      ]
    );
  }

  if (loading || !detail) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(detail.estadoCuenta);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/detalleSolicitud.png")}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <SafeAreaView edges={["top"]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Detalle de</Text>
            <Text style={styles.headerHighlight}>Restaurante</Text>
            <View style={styles.headerUnderline} />
          </View>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
      >
        <View style={styles.topRow}>
          <View style={styles.logoWrap}>
            {detail.logoUrl ? (
              <Image source={{ uri: optimizedImageUri(detail.logoUrl, "thumb") }} style={styles.logoImage} />
            ) : (
              <Ionicons name="restaurant" size={28} color="#FB8C00" />
            )}
          </View>
          <View style={styles.nameCol}>
            <Text style={styles.name}>{detail.nombreComercial}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.background }]}>
              <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
        </View>

        {detail.descripcion ? (
          <InfoRow icon="chatbox-ellipses-outline" label="Descripción" value={detail.descripcion} />
        ) : null}
        <InfoRow
          icon="location-outline"
          label="Dirección"
          value={`${detail.direccion}${detail.ciudad ? `, ${detail.ciudad}` : ""}`}
        />
        <InfoRow icon="star-outline" label="Calificación promedio" value={detail.calificacionPromedio.toFixed(1)} />
        <InfoRow icon="chatbubbles-outline" label="Reseñas" value={String(detail.cantidadResenas)} />
        <InfoRow icon="receipt-outline" label="Pedidos" value={String(detail.cantidadPedidos)} />
        <InfoRow icon="flag-outline" label="Reportes recibidos" value={String(detail.cantidadReportes)} />
        <InfoRow
          icon="calendar-outline"
          label="Alta en MenuDays"
          value={new Date(detail.createdAt).toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })}
        />

        <View style={styles.actionsCol}>
          {detail.estadoCuenta === "activo" && (
            <TouchableOpacity style={styles.pauseButton} onPress={confirmPause} disabled={actionLoading}>
              <Ionicons name="pause-circle-outline" size={18} color="#FB8C00" />
              <Text style={styles.pauseText}>Pausar restaurante</Text>
            </TouchableOpacity>
          )}
          {detail.estadoCuenta === "suspendido" && (
            <TouchableOpacity style={styles.reactivateButton} onPress={confirmReactivate} disabled={actionLoading}>
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.reactivateText}>Reactivar restaurante</Text>
            </TouchableOpacity>
          )}
          {detail.estadoCuenta === "eliminado" && (
            <TouchableOpacity style={styles.reactivateButton} onPress={confirmReactivate} disabled={actionLoading}>
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
              <Text style={styles.reactivateText}>Restaurar restaurante</Text>
            </TouchableOpacity>
          )}
          {detail.estadoCuenta !== "eliminado" && (
            <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={actionLoading}>
              <Ionicons name="trash-outline" size={18} color="#E53935" />
              <Text style={styles.deleteText}>Eliminar restaurante</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <AdminBottomNav />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { height: 180 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,10,5,0.55)" },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(120,50,20,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
    marginTop: 8,
  },
  headerTextWrap: { alignItems: "center", marginTop: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  headerHighlight: { fontSize: 20, fontWeight: "800", color: "#FFC24D" },
  headerUnderline: { width: 40, height: 3, borderRadius: 2, backgroundColor: "#FB8C00", marginTop: 6 },

  card: { flex: 1, marginTop: -24, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  cardContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#FB8C00",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E0",
    overflow: "hidden",
  },
  logoImage: { width: 64, height: 64, borderRadius: 32 },
  nameCol: { flex: 1 },
  name: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 6 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "700" },

  actionsCol: { gap: 12, marginTop: 26 },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#FB8C00",
    borderRadius: 24,
    paddingVertical: 13,
  },
  pauseText: { color: "#FB8C00", fontWeight: "700", fontSize: 14 },
  reactivateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#43A047",
    borderRadius: 24,
    paddingVertical: 13,
  },
  reactivateText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E53935",
    borderRadius: 24,
    paddingVertical: 13,
  },
  deleteText: { color: "#E53935", fontWeight: "700", fontSize: 14 },
});
