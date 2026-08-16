import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import NotificationService, {
  NotificationItem,
  NotificationType,
} from "../../services/notification.service";

// Pantalla de notificaciones del admin. Se llega acá desde la campanita
// del dashboard (app/(admin)/dashboard.tsx). Al entrar, se marca como
// leída cada notificación que el admin toca; "Marcar todas" limpia el
// badge de una. No es una tab -- se navega con router.push/back como
// solicitud-detalle.tsx.

const TYPE_ICON: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  solicitud_nueva: "document-text-outline",
  solicitud_aprobada: "checkmark-circle-outline",
  solicitud_rechazada: "close-circle-outline",
  pedido_aceptado: "checkmark-done-outline",
  pedido_rechazado: "close-circle-outline",
  pedido_estado: "receipt-outline",
  pedido_listo: "fast-food-outline",
  restaurante_suspendido: "alert-circle-outline",
  recuperacion_password: "key-outline",
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Recién";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
}

export default function AdminNotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    NotificationService.getAll()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  async function handlePressNotification(item: NotificationItem) {
    if (!item.leida) {
      // Optimista: se marca visualmente al toque, sin esperar la
      // respuesta del back para que se sienta inmediato.
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, leida: true } : n))
      );
      NotificationService.markAsRead(item.id).catch(() => {});
    }

    if (item.referenciaTipo === "solicitud_restaurante" && item.referenciaId) {
      router.push({
        pathname: "/(admin)/solicitud-detalle",
        params: { id: String(item.referenciaId) },
      } as any);
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    try {
      await NotificationService.markAllAsRead();
    } catch {
      load();
    }
  }

  const hasUnread = notifications.some((n) => !n.leida);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {hasUnread ? (
          <TouchableOpacity onPress={handleMarkAllRead} hitSlop={10}>
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markAllPlaceholder} />
        )}
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#FB8C00" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerWrap}>
          <Ionicons name="notifications-off-outline" size={36} color="#D9D9D9" />
          <Text style={styles.emptyText}>No tenés notificaciones por ahora.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, !item.leida && styles.rowUnread]}
              activeOpacity={0.85}
              onPress={() => handlePressNotification(item)}
            >
              <View style={[styles.iconCircle, !item.leida && styles.iconCircleUnread]}>
                <Ionicons
                  name={TYPE_ICON[item.tipo] ?? "notifications-outline"}
                  size={18}
                  color={!item.leida ? "#FB8C00" : "#9E9E9E"}
                />
              </View>

              <View style={styles.rowContent}>
                <View style={styles.rowTopLine}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  {!item.leida && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.rowMessage} numberOfLines={2}>
                  {item.mensaje}
                </Text>
                <Text style={styles.rowTime}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  markAllText: { fontSize: 13, fontWeight: "700", color: "#FB8C00" },
  markAllPlaceholder: { width: 36 },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 30 },
  emptyText: { textAlign: "center", color: "#9E9E9E", fontSize: 13, lineHeight: 19 },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 30 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  rowUnread: {
    backgroundColor: "#FFFBF5",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleUnread: {
    backgroundColor: "#FFF3E0",
  },
  rowContent: { flex: 1 },
  rowTopLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: "#1A1A1A" },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#FB8C00" },
  rowMessage: { fontSize: 13, color: "#6B6B6B", marginTop: 2, lineHeight: 18 },
  rowTime: { fontSize: 11, color: "#B0B0B0", marginTop: 4 },
});
