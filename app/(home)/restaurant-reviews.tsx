import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ReviewService, { Review } from "../../services/review.service";
import { AppAlert } from "../components/common/AppAlert";
import { EmptyState } from "../components/common/EmptyState";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Pantalla de "Ver todas las reseñas". El back todavía devuelve el
// listado completo en una sola llamada (GET /restaurants/:id/reviews sin
// paginar -- ver review.service.ts), así que la "página siguiente" que
// se ve acá es un reveal incremental del lado cliente sobre ese array
// completo. El día que el endpoint pagine de verdad, alcanza con
// reemplazar `visibleCount` por un fetch real de la página siguiente.
const PAGE_SIZE = 15;

type StarFilter = 0 | 1 | 2 | 3 | 4 | 5;

export default function RestaurantReviewsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id, nombre, promedio, cantidad } = useLocalSearchParams<{
    id: string;
    nombre?: string;
    promedio?: string;
    cantidad?: string;
  }>();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [starFilter, setStarFilter] = useState<StarFilter>(0);

  function loadReviews() {
    if (!id) return;
    ReviewService.getRestaurantReviews(id)
      .then(setReviews)
      .catch((e: any) => AppAlert.alert("Error", e.message || "No se pudieron cargar las reseñas."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    if (!id) return;
    // Reseteo antes de cada fetch: sin esto, al entrar a las reseñas
    // de otro restaurante se seguían viendo las reseñas (y el filtro
    // de estrellas / paginado) del restaurante anterior mientras
    // cargaba, y si el fetch nuevo fallaba quedaban ahí para siempre,
    // atribuidas al restaurante equivocado.
    setLoading(true);
    setReviews([]);
    setVisibleCount(PAGE_SIZE);
    setStarFilter(0);
    loadReviews();
  }, [id]);

  function handleRefresh() {
    setRefreshing(true);
    loadReviews();
  }

  const distribution = useMemo(() => buildDistribution(reviews), [reviews]);

  const filtered = useMemo(
    () => (starFilter === 0 ? reviews : reviews.filter((r) => r.calificacion === starFilter)),
    [reviews, starFilter]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const promedioNum = promedio ? Number(promedio) : reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.calificacion, 0) / reviews.length
    : 0;
  const cantidadNum = cantidad ? Number(cantidad) : reviews.length;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Reseñas{nombre ? ` · ${nombre}` : ""}
        </Text>
        <View style={styles.roundButton} />
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
          ListHeaderComponent={
            <View>
              <View style={styles.summaryRow}>
                <View style={styles.avgWrap}>
                  <Text style={styles.avgNumber}>{promedioNum.toFixed(1)}</Text>
                  <View style={{ flexDirection: "row" }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={12}
                        color={i < Math.round(promedioNum) ? "#F5A800" : colors.border}
                      />
                    ))}
                  </View>
                  <Text style={styles.avgLabel}>{cantidadNum} reseñas</Text>
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <View key={star} style={styles.distributionRow}>
                      <Text style={styles.distributionStar}>{star}</Text>
                      <View style={styles.distributionTrack}>
                        <View
                          style={[styles.distributionFill, { width: `${distribution[star] ?? 0}%` }]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[0, 5, 4, 3, 2, 1] as StarFilter[]}
                keyExtractor={(s) => String(s)}
                contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
                renderItem={({ item: star }) => (
                  <TouchableOpacity
                    style={[styles.chip, starFilter === star && styles.chipActive]}
                    onPress={() => {
                      setStarFilter(star);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <Text style={[styles.chipText, starFilter === star && styles.chipTextActive]}>
                      {star === 0 ? "Todas" : `${star} ★`}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          }
          renderItem={({ item: review }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeaderRow}>
                {review.usuarios.foto_perfil_url ? (
                  <Image source={{ uri: review.usuarios.foto_perfil_url }} style={styles.reviewAvatar} />
                ) : (
                  <View style={[styles.reviewAvatar, styles.reviewAvatarPlaceholder]}>
                    <Ionicons name="person" size={14} color={colors.placeholder} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewName}>
                    {review.usuarios.nombre} {review.usuarios.apellido}
                  </Text>
                  <Text style={styles.reviewDate}>{relativeTime(review.created_at)}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 1 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={12}
                      color={i < review.calificacion ? "#F5A800" : colors.border}
                    />
                  ))}
                </View>
              </View>
              {review.comentario ? <Text style={styles.reviewComment}>"{review.comentario}"</Text> : null}
              {review.respuesta_restaurante ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>Respuesta del restaurante</Text>
                  <Text style={styles.replyText}>{review.respuesta_restaurante}</Text>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              mascot={require("../../assets/images/nene-pensando.png")}
              text={
                starFilter === 0
                  ? "Este restaurante todavía no tiene reseñas."
                  : "No hay reseñas con esa calificación."
              }
            />
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity style={styles.loadMoreButton} onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                <Text style={styles.loadMoreText}>Ver más reseñas</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

function buildDistribution(reviews: Review[]): Record<number, number> {
  if (reviews.length === 0) return {};
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    counts[r.calificacion] = (counts[r.calificacion] ?? 0) + 1;
  });
  const result: Record<number, number> = {};
  for (const star of [1, 2, 3, 4, 5]) {
    result[star] = (counts[star] / reviews.length) * 100;
  }
  return result;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? "es" : ""}`;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenSolid },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "800", color: colors.text },

  list: { padding: 20, paddingBottom: 60 },

  summaryRow: { flexDirection: "row", gap: 20, alignItems: "center", marginBottom: 14 },
  avgWrap: { alignItems: "center", gap: 2 },
  avgNumber: { fontSize: 30, fontWeight: "900", color: colors.text },
  avgLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: "700" },
  distributionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  distributionStar: { fontSize: 11, color: colors.textSecondary, width: 10 },
  distributionTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.divider, overflow: "hidden" },
  distributionFill: { height: "100%", backgroundColor: "#FFA726" },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.surfaceSecondary, borderColor: "#FFA726" },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  chipTextActive: { color: "#FB8C00" },

  reviewCard: { borderTopWidth: 1, borderTopColor: colors.divider, paddingVertical: 14 },
  reviewHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17 },
  reviewAvatarPlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  reviewName: { fontSize: 13, fontWeight: "700", color: colors.text },
  reviewDate: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  reviewComment: { fontSize: 12, color: colors.textSecondary, marginTop: 8, lineHeight: 18, fontStyle: "italic" },

  replyBox: { marginTop: 10, backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 10 },
  replyLabel: { fontSize: 11, fontWeight: "800", color: "#FB8C00", marginBottom: 3 },
  replyText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },

  emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 50 },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", paddingHorizontal: 30 },

  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFA726",
    borderRadius: 22,
    paddingVertical: 13,
    marginTop: 10,
  },
  loadMoreText: { fontSize: 13, fontWeight: "700", color: "#FB8C00" },
});