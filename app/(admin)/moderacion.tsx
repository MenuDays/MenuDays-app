import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import SolicitudHeader from "../components/admin/SolicitudHeader";
import AdminBottomNav from "../components/admin/AdminBottomNav";
import ReporteCard from "../components/admin/ReporteCard";
import ReporteTabs from "../components/admin/ReporteTabs";

import ReportsAdminService, {
  ReportListItem,
  ReportStatus,
} from "../../services/reportsAdmin.service";

export default function ModeracionScreen() {
  const [status, setStatus] = useState<ReportStatus>("pendiente");
  const [allReports, setAllReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await ReportsAdminService.getAll();
      setAllReports(data);
    } catch (e) {
      console.log("Error cargando reportes:", e);
    } finally {
      setLoading(false);
    }
  }

  const counts: Record<ReportStatus, number> = {
    pendiente: allReports.filter((r) => r.estado === "pendiente").length,
    resuelto: allReports.filter((r) => r.estado === "resuelto").length,
    archivado: allReports.filter((r) => r.estado === "archivado").length,
  };

  const items = allReports.filter((r) => r.estado === status);

  function handleOpenReport(id: string) {
    router.push({
      pathname: "/(admin)/reporte-detalle",
      params: { id },
    } as any);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ReporteCard report={item} onPress={() => handleOpenReport(item.id)} />
          </View>
        )}
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
              <ReporteTabs selected={status} counts={counts} onSelect={setStatus} />

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FB8C00" />
                </View>
              ) : items.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay reportes {statusLabel(status)} por ahora</Text>
                </View>
              ) : null}
            </View>
          </>
        }
      />

      <AdminBottomNav />
    </View>
  );
}

function statusLabel(status: ReportStatus) {
  if (status === "pendiente") return "pendientes";
  if (status === "resuelto") return "resueltos";
  return "archivados";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  cardWrapper: {
    paddingHorizontal: 18,
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#9E9E9E",
  },
});