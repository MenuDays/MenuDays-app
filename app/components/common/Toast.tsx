import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

// Aviso breve, NO bloqueante, estilo iOS -- para confirmar acciones que
// SÍ se guardaron en la BD sin frenar al usuario con un diálogo (que se
// reserva para decisiones y errores). Se usa igual que AppAlert:
//   Toast.success("Cambios guardados")
//   Toast.error("No se pudo guardar")
// Vive una sola vez, montado junto a <AppAlertProvider> en app/_layout.tsx.

type ToastKind = "success" | "error" | "info";

interface ToastState {
  id: number;
  kind: ToastKind;
  message: string;
}

type ShowFn = (message: string, kind?: ToastKind) => void;

let showToastRef: ShowFn | null = null;

function show(message: string, kind: ToastKind) {
  if (showToastRef) showToastRef(message, kind);
  else if (__DEV__) console.warn("Toast: el ToastProvider todavía no está montado");
}

export const Toast = {
  success(message: string) {
    show(message, "success");
  },
  error(message: string) {
    show(message, "error");
  },
  info(message: string) {
    show(message, "info");
  },
};

const KIND_META: Record<
  ToastKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  success: { icon: "checkmark-circle", color: "#34C759" },
  error: { icon: "alert-circle", color: "#FF3B30" },
  info: { icon: "information-circle", color: "#0A84FF" },
};

const VISIBLE_MS = 2400;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [anim]);

  useEffect(() => {
    showToastRef = (message, kind = "success") => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ id: Date.now(), kind, message });
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        friction: 9,
        tension: 80,
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(dismiss, VISIBLE_MS);
    };
    return () => {
      showToastRef = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [anim, dismiss]);

  const meta = toast ? KIND_META[toast.kind] : KIND_META.success;

  return (
    <>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              top: insets.top + 10,
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.card}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
            <Text style={styles.text} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
      paddingHorizontal: 20,
      zIndex: 10000,
      elevation: 10000,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      maxWidth: 420,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: colors.modalBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.16,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    text: {
      flexShrink: 1,
      fontSize: 13.5,
      fontWeight: "600",
      color: colors.text,
    },
  });
