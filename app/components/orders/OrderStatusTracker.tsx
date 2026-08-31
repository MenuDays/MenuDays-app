import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  ORDER_STATUS_FLOW,
  OrderStatus,
  OrderStatusHistoryEntry,
} from "../../../services/order.service";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

// ==========================================================================
// Bloque grande "ESTADO DEL PEDIDO" + línea de tiempo -- vista comensal.
//
// - El estado actual es lo MÁS visible de la pantalla (bloque grande con
//   color, ícono y punto).
// - Debajo, la línea de tiempo del camino feliz
//   (Pendiente -> Aceptado -> Preparando -> Listo -> Entregado) con cada
//   paso hecho / en curso / pendiente. Si el back mandó `historial`
//   (pedido_historial_estados), se muestra la hora de cada paso.
// - rechazado / cancelado: se muestra hasta dónde llegó + una fila roja
//   terminal.
//
// No hace ninguna llamada: es 100% presentacional. El polling vive en
// useOrderDetail.
// ==========================================================================

interface StatusMeta {
  label: string; // corto, para el bloque grande y la línea de tiempo
  sublabel: string; // frase para el bloque grande
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function getStatusMeta(estado: OrderStatus, colors: ThemeColors): StatusMeta {
  switch (estado) {
    case "pendiente":
      return {
        label: "PENDIENTE",
        sublabel: "Esperando que el restaurante lo confirme",
        color: "#FB8C00",
        bg: "#FFF3E0",
        icon: "time-outline",
      };
    case "aceptado":
      return {
        label: "ACEPTADO",
        sublabel: "El restaurante confirmó tu pedido",
        color: "#1E88E5",
        bg: "#E3F2FD",
        icon: "checkmark-circle-outline",
      };
    case "preparando":
      return {
        label: "PREPARANDO",
        sublabel: "Están preparando tu pedido",
        color: "#F5751A",
        bg: "#FFF1E0",
        icon: "flame-outline",
      };
    case "listo":
      return {
        label: "LISTO",
        sublabel: "Tu pedido está listo",
        color: "#2FB966",
        bg: "#E7F7EE",
        icon: "bag-check-outline",
      };
    case "entregado":
      return {
        label: "ENTREGADO",
        sublabel: "Pedido entregado. ¡Buen provecho!",
        color: "#2FB966",
        bg: "#E7F7EE",
        icon: "checkmark-done-circle-outline",
      };
    case "rechazado":
      return {
        label: "RECHAZADO",
        sublabel: "El restaurante no pudo tomar este pedido",
        color: "#E53935",
        bg: "#FFEBEE",
        icon: "close-circle-outline",
      };
    case "cancelado":
      return {
        label: "CANCELADO",
        sublabel: "Este pedido fue cancelado",
        color: "#9E9E9E",
        bg: colors.surfaceSecondary,
        icon: "ban-outline",
      };
  }
}

const STEP_SHORT: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
}

export default function OrderStatusTracker({
  estado,
  historial,
}: {
  estado: OrderStatus;
  historial?: OrderStatusHistoryEntry[];
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const meta = getStatusMeta(estado, colors);
  const isRejectedOrCancelled = estado === "rechazado" || estado === "cancelado";

  // Hora en la que el pedido ENTRÓ a cada estado (del historial real).
  const timeByStatus = useMemo(() => {
    const map: Partial<Record<OrderStatus, string>> = {};
    (historial ?? []).forEach((h) => {
      if (h?.estado_nuevo && h.created_at && !map[h.estado_nuevo]) {
        map[h.estado_nuevo] = h.created_at;
      }
    });
    return map;
  }, [historial]);

  const currentIndex = ORDER_STATUS_FLOW.indexOf(estado);

  return (
    <View>
      {/* ---------- Bloque grande: ESTADO ACTUAL ---------- */}
      <View style={[styles.hero, { backgroundColor: meta.bg, borderColor: `${meta.color}33` }]}>
        <Text style={[styles.heroKicker, { color: meta.color }]}>ESTADO DEL PEDIDO</Text>
        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { backgroundColor: `${meta.color}22` }]}>
            <Ionicons name={meta.icon} size={26} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroLabelRow}>
              <View style={[styles.heroDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.heroLabel, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.heroSublabel}>{meta.sublabel}</Text>
          </View>
        </View>
      </View>

      {/* ---------- Línea de tiempo ---------- */}
      <View style={styles.timeline}>
        {isRejectedOrCancelled ? (
          <>
            {/* Los pasos que sí llegaron a pasar (del historial). */}
            {ORDER_STATUS_FLOW.filter(
              (s) => s === "pendiente" || timeByStatus[s]
            ).map((step) => (
              <TimelineRow
                key={step}
                styles={styles}
                colors={colors}
                label={STEP_SHORT[step]}
                time={timeByStatus[step] ? formatTime(timeByStatus[step]!) : ""}
                state="done"
                isLast={false}
              />
            ))}
            <TimelineRow
              styles={styles}
              colors={colors}
              label={STEP_SHORT[estado]}
              time={timeByStatus[estado] ? formatTime(timeByStatus[estado]!) : ""}
              state="error"
              isLast
            />
          </>
        ) : (
          ORDER_STATUS_FLOW.map((step, i) => {
            const state: TimelineState =
              i < currentIndex ? "done" : i === currentIndex ? "current" : "pending";
            return (
              <TimelineRow
                key={step}
                styles={styles}
                colors={colors}
                label={STEP_SHORT[step]}
                time={timeByStatus[step] ? formatTime(timeByStatus[step]!) : ""}
                state={estado === "entregado" ? "done" : state}
                isLast={i === ORDER_STATUS_FLOW.length - 1}
              />
            );
          })
        )}
      </View>
    </View>
  );
}

type TimelineState = "done" | "current" | "pending" | "error";

function TimelineRow({
  styles,
  colors,
  label,
  time,
  state,
  isLast,
}: {
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  label: string;
  time: string;
  state: TimelineState;
  isLast: boolean;
}) {
  const dotColor =
    state === "done"
      ? "#2FB966"
      : state === "current"
      ? "#F5751A"
      : state === "error"
      ? "#E53935"
      : colors.border;

  return (
    <View style={styles.tlRow}>
      <View style={styles.tlMarkerCol}>
        <View
          style={[
            styles.tlDot,
            { backgroundColor: state === "pending" ? "transparent" : dotColor, borderColor: dotColor },
          ]}
        >
          {state === "done" ? (
            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
          ) : state === "error" ? (
            <Ionicons name="close" size={11} color="#FFFFFF" />
          ) : state === "current" ? (
            <View style={styles.tlPulse} />
          ) : null}
        </View>
        {!isLast && (
          <View
            style={[
              styles.tlLine,
              { backgroundColor: state === "done" ? "#2FB966" : colors.border },
            ]}
          />
        )}
      </View>

      <View style={styles.tlTextCol}>
        <Text
          style={[
            styles.tlLabel,
            {
              color:
                state === "pending"
                  ? colors.placeholder
                  : state === "error"
                  ? "#E53935"
                  : colors.text,
              fontWeight: state === "current" || state === "error" ? "800" : "600",
            },
          ]}
        >
          {label}
        </Text>
        {time ? <Text style={styles.tlTime}>{time}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    heroKicker: {
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      marginBottom: 8,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    heroLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    heroDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    heroLabel: {
      fontSize: 19,
      fontWeight: "900",
      letterSpacing: 0.3,
    },
    heroSublabel: {
      fontSize: 12.5,
      color: colors.textSecondary,
      marginTop: 3,
      lineHeight: 17,
    },

    timeline: {
      marginTop: 16,
      paddingLeft: 2,
    },
    tlRow: {
      flexDirection: "row",
      gap: 12,
    },
    tlMarkerCol: {
      alignItems: "center",
      width: 22,
    },
    tlDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    tlPulse: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#F5751A",
    },
    tlLine: {
      width: 2,
      flex: 1,
      minHeight: 18,
      marginVertical: 2,
    },
    tlTextCol: {
      flex: 1,
      paddingBottom: 14,
      paddingTop: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    tlLabel: {
      fontSize: 13.5,
    },
    tlTime: {
      fontSize: 11.5,
      color: colors.placeholder,
      fontWeight: "600",
      marginLeft: 8,
    },
  });
