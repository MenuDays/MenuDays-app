import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RestaurantApplicationsAdminService, {
  RestaurantApplicationDetail,
  buildWhatsAppNumber,
} from "../../services/restaurantApplicationsAdmin.service";
import AdminBottomNav from "../components/admin/AdminBottomNav";
import InfoRow from "../components/admin/InfoRow";

function getStatusInfo(status: RestaurantApplicationDetail["status"]) {
  switch (status) {
    case "aprobada":
      return { label: "Solicitud aprobada", color: "#43A047", background: "#E8F5E9" };
    case "rechazada":
      return { label: "Solicitud rechazada", color: "#E53935", background: "#FFEBEE" };
    default:
      return { label: "Solicitud en revisión", color: "#FB8C00", background: "#FFF3E0" };
  }
}

export default function SolicitudDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<RestaurantApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    RestaurantApplicationsAdminService.getById(Number(id))
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    if (!detail) return;
    setActionLoading(true);
    try {
      await RestaurantApplicationsAdminService.approve(detail.id);
      router.back();
    } catch (e) {
      console.log("Error al aprobar solicitud:", e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!detail) return;
    setActionLoading(true);
    try {
      await RestaurantApplicationsAdminService.reject(
        detail.id,
        "Solicitud rechazada por el administrador."
      );
      router.back();
    } catch (e) {
      console.log("Error al rechazar solicitud:", e);
    } finally {
      setActionLoading(false);
    }
  }

  function openMap() {
    if (!detail) return;
    const { latitude, longitude } = detail.location;
    Linking.openURL(`https://maps.google.com/?q=${latitude},${longitude}`);
  }

  function openWhatsApp() {
    if (!detail) return;
    const number = buildWhatsAppNumber(detail.dialCode, detail.phone);
    Linking.openURL(`https://wa.me/${number}`);
  }

  if (loading || !detail) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(detail.status);
  const showActions = detail.status === "pendiente";

  return (
    <View style={styles.container}>
      <ImageBackground
        // TODO: confirmar nombre/ubicación real del archivo (detalleSolicitud.png)
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
            <Text style={styles.headerTitle}>Detalle de Solicitud</Text>
            <Text style={styles.headerHighlight}>de Restaurante</Text>
            <View style={styles.headerUnderline} />
          </View>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView
        style={styles.card}
        contentContainerStyle={[
          styles.cardContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.logoPlaceholder}>
            {detail.logoUrl ? (
              <Image source={{ uri: detail.logoUrl }} style={styles.logoImage} />
            ) : (
              <Ionicons name={detail.avatarIcon as any} size={28} color="#FB8C00" />
            )}
          </View>
          <View style={styles.nameCol}>
            <Text style={styles.name}>{detail.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.background },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
        </View>

        <InfoRow icon="compass-outline" label="Provincia" value={detail.province} />
        <InfoRow icon="business-outline" label="Ciudad" value={detail.city} />
        <InfoRow icon="location-outline" label="Dirección" value={detail.location.address} />
        <TouchableOpacity onPress={openMap}>
          <InfoRow
            icon="navigate-outline"
            label="Ubicación GPS"
            value={`${detail.location.latitude.toFixed(4)}, ${detail.location.longitude.toFixed(4)} · Ver en mapa`}
          />
        </TouchableOpacity>
        <InfoRow icon="call-outline" label="Tel." value={detail.phone} />
        <InfoRow icon="fast-food-outline" label="Descripción" value={detail.description} />
        <InfoRow icon="person-outline" label="Usuario solicitante" value={detail.requestingUser} />
        <InfoRow icon="calendar-outline" label="Fecha de creación" value={detail.createdAt} />

        <View style={styles.socialBox}>
          <Text style={styles.socialTitle}>Redes Sociales</Text>
          <View style={styles.socialGrid}>
            {detail.socialMedia.instagram ? (
              <View style={styles.socialItem}>
                <Ionicons name="logo-instagram" size={16} color="#FB8C00" />
                <Text style={styles.socialText}>{detail.socialMedia.instagram}</Text>
              </View>
            ) : null}
            {detail.socialMedia.facebook ? (
              <View style={styles.socialItem}>
                <Ionicons name="logo-facebook" size={16} color="#FB8C00" />
                <Text style={styles.socialText}>{detail.socialMedia.facebook}</Text>
              </View>
            ) : null}
            {detail.socialMedia.tiktok ? (
              <View style={styles.socialItem}>
                <Ionicons name="logo-tiktok" size={16} color="#FB8C00" />
                <Text style={styles.socialText}>{detail.socialMedia.tiktok}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.socialItem} onPress={openWhatsApp}>
              <Ionicons name="logo-whatsapp" size={16} color="#FB8C00" />
              <Text style={styles.socialText}>{detail.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Documentos</Text>
        <View style={styles.docsRow}>
          {detail.documents.map((doc) => (
            <View key={doc.id} style={styles.docCol}>
              <Image source={{ uri: doc.uri }} style={styles.docImage} />
              <Text style={styles.docLabel}>{doc.label}</Text>
            </View>
          ))}
        </View>

        {showActions && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleReject}
              disabled={actionLoading}
            >
              <Ionicons name="close-circle-outline" size={18} color="#FB8C00" />
              <Text style={styles.rejectText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={handleApprove}
              disabled={actionLoading}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.approveText}>Aprobar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AdminBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
  },
  header: {
    height: 180,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,10,5,0.55)",
  },
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
  headerTextWrap: {
    alignItems: "center",
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerHighlight: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFC24D",
  },
  headerUnderline: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FB8C00",
    marginTop: 6,
  },
  card: {
    flex: 1,
    marginTop: -24,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  logoPlaceholder: {
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
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  nameCol: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FB8C00",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FB8C00",
  },
  socialBox: {
    backgroundColor: "#2A1E1A",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  socialTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FB8C00",
    marginBottom: 10,
  },
  socialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "45%",
  },
  socialText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 20,
    marginBottom: 10,
  },
  docsRow: {
    flexDirection: "row",
    gap: 10,
  },
  docCol: {
    flex: 1,
    gap: 6,
  },
  docImage: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },
  docLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#FB8C00",
    borderRadius: 24,
    paddingVertical: 12,
  },
  rejectText: {
    color: "#FB8C00",
    fontWeight: "700",
    fontSize: 14,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FB8C00",
    borderRadius: 24,
    paddingVertical: 12,
  },
  approveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});