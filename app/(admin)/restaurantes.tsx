import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import RestaurantsAdminService, {
  AdminRestaurantSummary,
  RestaurantAccountStatus,
} from "../../services/restaurantsAdmin.service";
import { AppAlert } from "../components/common/AppAlert";
import AdminBottomNav from "../components/admin/AdminBottomNav";
import SolicitudHeader from "../components/admin/SolicitudHeader";
import { useTheme } from "../../contexts/ThemeContext";
import { optimizedImageUri } from "../../utils/imageUrl";
import type { ThemeColors } from "../../contexts/ThemeContext";

type FilterTab = "todos" | RestaurantAccountStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "activo", label: "Activos" },
  { key: "suspendido", label: "Suspendidos" },
  { key: "eliminado", label: "Eliminados" },
];

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

export default function RestaurantesAdminScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [restaurants, setRestaurants] = useState<AdminRestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<FilterTab>("activo");

  const load = useCallback(() => {
    RestaurantsAdminService.getAll()
      .then(setRestaurants)
      .catch(() => AppAlert.alert("Error", "No se pudieron cargar los restaurantes."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useFocusEffect(load);

  function handleRefresh() {
    setRefreshing(true);
    load();
  }

  const counts = useMemo(() => {
    return {
      todos: restaurants.length,
      activo: restaurants.filter((r) => r.estadoCuenta === "activo").length,
      suspendido: restaurants.filter((r) => r.estadoCuenta === "suspendido").length,
      eliminado: restaurants.filter((r) => r.estadoCuenta === "eliminado").length,
    };
  }, [restaurants]);

  const filtered = useMemo(() => {
    if (tab === "todos") return restaurants;
    return restaurants.filter((r) => r.estadoCuenta === tab);
  }, [restaurants, tab]);

  function openDetail(id: number) {
    router.push({
      pathname: "/(admin)/restaurante-admin-detalle",
      params: { id: String(id) },
    } as any);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
        ListHeaderComponent={
          <>
            <SolicitudHeader
              title="Gestión de"
              highlight="Restaurantes"
              subtitle="Administrá el estado de cuenta de cada restaurante"
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
                  <Ionicons name="restaurant-outline" size={32} color={colors.placeholder} />
                  <Text style={styles.emptyText}>No hay restaurantes en esta categoría.</Text>
                </View>
              ) : null}
            </View>
          </>
        }
        renderItem={({ item }) => {
          const statusInfo = getStatusInfo(item.estadoCuenta);
          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openDetail(item.id)}>
                {item.logoUrl ? (
                  <Image source={{ uri: optimizedImageUri(item.logoUrl, "thumb") }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, styles.logoPlaceholder]}>
                    <Ionicons name="restaurant-outline" size={18} color="#FB8C00" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.nombreComercial}
                  </Text>
                  <View style={styles.metaRow}>
                    {item.ciudad ? <Text style={styles.metaText}>{item.ciudad}</Text> : null}
                    <View style={styles.ratingWrap}>
                      <Ionicons name="star" size={11} color="#F5A800" />
                      <Text style={styles.metaText}>{item.calificacionPromedio.toFixed(1)}</Text>
                    </View>
                    {item.cantidadReportes > 0 && (
                      <View style={styles.reportsWrap}>
                        <Ionicons name="flag" size={10} color="#E53935" />
                        <Text style={styles.reportsText}>{item.cantidadReportes}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusInfo.background }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <AdminBottomNav />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 18, paddingTop: 16 },
  listContent: { paddingBottom: 110 },
  cardWrapper: { paddingHorizontal: 18 },

  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: "#FB8C00", borderColor: "#FB8C00" },
  tabText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  tabTextActive: { color: "#FFFFFF" },

  stateContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 13, color: colors.textSecondary },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logo: { width: 46, height: 46, borderRadius: 14 },
  logoPlaceholder: { backgroundColor: "#FFF3E0", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "800", color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 3 },
  metaText: { fontSize: 11.5, color: colors.textSecondary, fontWeight: "600" },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  reportsWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  reportsText: { fontSize: 11, color: "#E53935", fontWeight: "700" },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10.5, fontWeight: "800" },
});
