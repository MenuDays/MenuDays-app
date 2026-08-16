import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ReportService, { ReportItem, ReportStatus } from "../../services/report.service";
import { AppAlert } from "../components/common/AppAlert";
import AdminBottomNav from "../components/admin/AdminBottomNav";
import SolicitudHeader from "../components/admin/SolicitudHeader";

type FilterTab = "todos" | ReportStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "resuelto", label: "Resueltos" },
  { key: "archivado", label: "Archivados" },
];

function getStatusInfo(status: ReportStatus) {
  switch (status) {
    case "resuelto":
      return { label: "Resuelto", color: "#43A047", background: "#E8F5E9" };
    case "archivado":
      return { label: "Archivado", color: "#9E9E9E", background: "#F0F0F0" };
    default:
      return { label: "Pendiente", color: "#FB8C00", background: "#FFF3E0" };
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ModeracionScreen() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pendiente");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const load = useCallback(() => {
    ReportService.getAll()
      .then(setReports)
      .catch(() => AppAlert.alert("Error", "No se pudieron cargar los reportes."))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const counts = useMemo(() => {
    return {
      todos: reports.length,
      pendiente: reports.filter((r) => r.estado === "pendiente").length,
      resuelto: reports.filter((r) => r.estado === "resuelto").length,
      archivado: reports.filter((r) => r.estado === "archivado").length,
    };
  }, [reports]);

  const filtered = useMemo(() => {
    if (tab === "todos") return reports;
    return reports.filter((r) => r.estado === tab);
  }, [reports, tab]);

  async function handleUpdateStatus(report: ReportItem, estado: "archivado" | "resuelto") {
    setActionLoadingId(report.id);
    try {
      const updated = await ReportService.updateStatus(report.id, estado);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar el reporte.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function confirmResolve(report: ReportItem) {
    AppAlert.alert(
      "Resolver reporte",
      `¿Marcar como resuelto el reporte sobre "${report.restaurant.nombreComercial}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Resolver", onPress: () => handleUpdateStatus(report, "resuelto") },
      ]
    );
  }

  function confirmArchive(report: ReportItem) {
    AppAlert.alert(
      "Archivar reporte",
      `¿Archivar el reporte sobre "${report.restaurant.nombreComercial}"? Se marcará como no accionable.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Archivar", style: "destructive", onPress: () => handleUpdateStatus(report, "archivado") },
      ]
    );
  }

  function openRestaurant(report: ReportItem) {
    router.push({
      pathname: "/(admin)/restaurante-admin-detalle",
      params: { id: String(report.restaurant.id) },
    } as any);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <SolicitudHeader
              title="Moderación de"
              highlight="Reportes"
              subtitle="Revisá y gestioná los reportes de restaurantes"
            />
            <View style={styles.content}>
              <View style={styles.tabsRow}>
                {TABS.map((t) => {
                  const active = tab === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.tab, active && styles.tabActive]}
                      onPress={() => setTab(t.key)}
                    >
                      <Text style={[styles.tabText, active && styles.tabTextActive]}>
                        {t.label} ({counts[t.key]})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {loading ? (
                <View style={styles.stateContainer}>
                  <ActivityIndicator size="large" color="#FB8C00" />
                </View>
              ) : filtered.length === 0 ? (
                <View style={styles.stateContainer}>
                  <Ionicons name="shield-checkmark-outline" size={32} color="#D9D9D9" />
                  <Text style={styles.emptyText}>No hay reportes en esta categoría.</Text>
                </View>
              ) : null}
            </View>
          </>
        }
        renderItem={({ item }) => {
          const statusInfo = getStatusInfo(item.estado);
          const isPending = item.estado === "pendiente";
          const isActing = actionLoadingId === item.id;

          return (
            <View style={styles.cardWrapper}>
              <View style={styles.card}>
                <View style={styles.cardTopRow}>
                  <TouchableOpacity style={styles.restaurantRow} onPress={() => openRestaurant(item)}>
                    {item.restaurant.logoUrl ? (
                      <Image source={{ uri: item.restaurant.logoUrl }} style={styles.logo} />
                    ) : (
                      <View style={[styles.logo, styles.logoPlaceholder]}>
                        <Ionicons name="restaurant-outline" size={16} color="#FB8C00" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.restaurantName} numberOfLines={1}>
                        {item.restaurant.nombreComercial}
                      </Text>
                      <Text style={styles.reportDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.background }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.motivoBadge}>
                  <Ionicons name="flag" size={12} color="#E53935" />
                  <Text style={styles.motivoText}>{item.motivo}</Text>
                </View>

                {item.descripcion ? (
                  <Text style={styles.descripcion} numberOfLines={4}>
                    {item.descripcion}
                  </Text>
                ) : null}

                <View style={styles.reporterRow}>
                  <Ionicons name="person-circle-outline" size={15} color="#9E9E9E" />
                  <Text style={styles.reporterText} numberOfLines={1}>
                    {item.reporter.nombre} {item.reporter.apellido}
                  </Text>
                </View>

                {item.reviewedBy ? (
                  <Text style={styles.reviewedText}>
                    Gestionado por {item.reviewedBy.nombre} {item.reviewedBy.apellido}
                  </Text>
                ) : null}

                {isPending && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.archiveButton}
                      onPress={() => confirmArchive(item)}
                      disabled={isActing}
                    >
                      <Ionicons name="archive-outline" size={15} color="#757575" />
                      <Text style={styles.archiveText}>Archivar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.resolveButton}
                      onPress={() => confirmResolve(item)}
                      disabled={isActing}
                    >
                      {isActing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" />
                          <Text style={styles.resolveText}>Resolver</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      <AdminBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  listContent: { paddingBottom: 110 },
  cardWrapper: { paddingHorizontal: 18 },

  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEDED",
  },
  tabActive: { backgroundColor: "#FB8C00", borderColor: "#FB8C00" },
  tabText: { fontSize: 12, fontWeight: "700", color: "#757575" },
  tabTextActive: { color: "#FFFFFF" },

  stateContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 13, color: "#9E9E9E" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  restaurantRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 12 },
  logoPlaceholder: { backgroundColor: "#FFF3E0", alignItems: "center", justifyContent: "center" },
  restaurantName: { fontSize: 14, fontWeight: "800", color: "#1A1A1A" },
  reportDate: { fontSize: 11, color: "#9E9E9E", marginTop: 1 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "800" },

  motivoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 12,
  },
  motivoText: { fontSize: 11.5, fontWeight: "700", color: "#E53935" },
  descripcion: { fontSize: 12.5, color: "#6B6B6B", marginTop: 8, lineHeight: 18 },

  reporterRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  reporterText: { fontSize: 11.5, color: "#9E9E9E" },
  reviewedText: { fontSize: 11, color: "#B0B0B0", marginTop: 4, fontStyle: "italic" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  archiveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingVertical: 10,
  },
  archiveText: { fontSize: 13, fontWeight: "700", color: "#757575" },
  resolveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#43A047",
    borderRadius: 20,
    paddingVertical: 10,
  },
  resolveText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});
