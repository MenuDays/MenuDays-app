import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

import SolicitudHeader from "../components/admin/SolicitudHeader";

import SolicitudTabs from "../components/admin/SolicitudTabs";
import SolicitudCard from "../components/admin/SolicitudCard";
import Pagination from "../components/admin/Pagination";
import AdminBottomNav from "../components/admin/AdminBottomNav";

import RestaurantApplicationsAdminService, {
  AdminApplicationStatus,
  RestaurantApplicationSummary,
} from "../../services/restaurantApplicationsAdmin.service";

export default function SolicitudesScreen() {
  const [status, setStatus] = useState<AdminApplicationStatus>("accepted");
  const [items, setItems] = useState<RestaurantApplicationSummary[]>([]);
  const [counts, setCounts] = useState<Record<AdminApplicationStatus, number>>(
    { accepted: 0, pending: 0, rejected: 0 }
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    RestaurantApplicationsAdminService.getCounts().then(setCounts);
  }, []);

  useEffect(() => {
    loadPage(status, 1);
  }, [status]);

  async function loadPage(
    targetStatus: AdminApplicationStatus,
    targetPage: number
  ) {
    setLoading(true);
    try {
      const result = await RestaurantApplicationsAdminService.getByStatus(
        targetStatus,
        targetPage
      );
      setItems(result.items);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (e) {
      console.log("Error cargando solicitudes:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectStatus(newStatus: AdminApplicationStatus) {
    setStatus(newStatus);
  }

  function handleChangePage(newPage: number) {
    loadPage(status, newPage);
  }

  function handleOpenApplication(id: number) {
    router.push({
      pathname: "/(admin)/solicitud-detalle",
      params: { id: String(id) },
    } as any);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <SolicitudHeader
        title="Solicitudes de"
        highlight="Restaurantes"
        subtitle="Gestioná y revisá las solicitudes de nuevos restaurantes"
      />

      <View style={styles.content}>
        <SolicitudTabs
          selected={status}
          counts={counts}
          onSelect={handleSelectStatus}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FB8C00" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay solicitudes {statusLabel(status)} por ahora
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <SolicitudCard
                application={item}
                onPress={() => handleOpenApplication(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onChangePage={handleChangePage}
        />
      </View>

      <AdminBottomNav />
    </View>
  );
}

function statusLabel(status: AdminApplicationStatus) {
  if (status === "accepted") return "aceptadas";
  if (status === "pending") return "pendientes";
  return "rechazadas";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 14,
    color: "#9E9E9E",
  },
});