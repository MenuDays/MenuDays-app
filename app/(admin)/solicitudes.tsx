import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import SolicitudHeader from "../components/admin/SolicitudHeader";

import AdminBottomNav from "../components/admin/AdminBottomNav";
import Pagination from "../components/admin/Pagination";
import SolicitudCard from "../components/admin/SolicitudCard";
import SolicitudTabs from "../components/admin/SolicitudTabs";

import RestaurantApplicationsAdminService, {
  AdminApplicationStatus,
  RestaurantApplicationSummary,
} from "../../services/restaurantApplicationsAdmin.service";

export default function SolicitudesScreen() {
  const [status, setStatus] = useState<AdminApplicationStatus>("pendiente");
  const [items, setItems] = useState<RestaurantApplicationSummary[]>([]);
  const [counts, setCounts] = useState<Record<AdminApplicationStatus, number>>(
  {
    pendiente: 0,
    aprobada: 0,
    rechazada: 0,
  }
);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Se recarga cada vez que la pantalla vuelve a tener foco (no solo al
  // montar) -- así, al volver de solicitud-detalle.tsx después de
  // aprobar/rechazar una solicitud, tanto los contadores de las tabs
  // como el listado de la tab actual reflejan el estado real sin
  // necesidad de cerrar y volver a abrir la app.
  useFocusEffect(
    useCallback(() => {
      RestaurantApplicationsAdminService.getCounts().then(setCounts);
      loadPage(status, 1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status])
  );

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

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <SolicitudCard
              application={item}
              onPress={() => handleOpenApplication(item.id)}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <SolicitudHeader
              title="Solicitudes de"
              highlight="Restaurantes"
              subtitle="Gestiona y revisa las solicitudes de nuevos restaurantes"
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
              ) : null}
            </View>
          </>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.content}>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChangePage={handleChangePage}
              />
            </View>
          ) : null
        }
      />

      <AdminBottomNav />
    </View>
  );
}

function statusLabel(status: AdminApplicationStatus) {
  if (status === "aprobada") return "aprobadas";
  if (status === "pendiente") return "pendientes";
  return "rechazadas";
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
    paddingBottom: 8,
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