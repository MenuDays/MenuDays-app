import React, { useEffect, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Reemplazo de Alert.alert (react-native) con el mismo estilo visual del
// resto de la app (header naranja, cards redondeadas, colores de
// StatusBadge). Se usa igual que Alert.alert para no tener que reescribir
// la lógica de cada pantalla: `AppAlert.alert(titulo, mensaje, botones)`.

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

type AlertVariant = "success" | "info" | "warning" | "danger";

type ShowFn = (title: string, message?: string, buttons?: AlertButton[]) => void;

let showAlertRef: ShowFn | null = null;

export const AppAlert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (showAlertRef) {
      showAlertRef(title, message, buttons);
    } else if (__DEV__) {
      console.warn("AppAlert.alert: el AppAlertProvider todavía no está montado");
    }
  },
};

const VARIANT_META: Record<AlertVariant, { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: "#E8F5E9", color: "#43A047", icon: "checkmark-circle" },
  info: { bg: "#E3F2FD", color: "#1E88E5", icon: "information-circle" },
  warning: { bg: "#FFF3E0", color: "#FB8C00", icon: "alert-circle" },
  danger: { bg: "#FFEBEE", color: "#E53935", icon: "close-circle" },
};

function inferVariant(title: string, buttons: AlertButton[]): AlertVariant {
  const hasDestructive = buttons.some((b) => b.style === "destructive");
  const t = title.toLowerCase();

  if (hasDestructive || t.includes("error")) return "danger";
  if (t.includes("próxim") || t.includes("pronto")) return "info";
  if (
    t.includes("falta") ||
    t.includes("incompleto") ||
    t.includes("inválido") ||
    t.includes("necesario")
  ) {
    return "warning";
  }
  if (buttons.length > 1) return "warning";
  return "info";
}

const DEFAULT_BUTTON: AlertButton = { text: "Aceptar" };

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [buttons, setButtons] = useState<AlertButton[]>([DEFAULT_BUTTON]);

  useEffect(() => {
    showAlertRef = (t, m, b) => {
      setTitle(t);
      setMessage(m);
      setButtons(b && b.length > 0 ? b : [DEFAULT_BUTTON]);
      setVisible(true);
    };
    return () => {
      showAlertRef = null;
    };
  }, []);

  function handlePress(button: AlertButton) {
    setVisible(false);
    // Esperamos a que cierre el modal antes de disparar el callback, para
    // que no se pise con una navegación o con otro alert encadenado.
    setTimeout(() => button.onPress?.(), 150);
  }

  const variant = inferVariant(title, buttons);
  const meta = VARIANT_META[variant];
  const stacked = buttons.length > 2;

  return (
    <>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={30} color={meta.color} />
            </View>

            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={[styles.buttonsRow, stacked && styles.buttonsColumn]}>
              {buttons.map((button, index) => {
                const isCancel = button.style === "cancel";
                const isDestructive = button.style === "destructive";
                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.button,
                      isCancel && styles.buttonCancel,
                      isDestructive && styles.buttonDestructive,
                      stacked && styles.buttonStacked,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handlePress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.buttonTextCancel,
                      ]}
                      numberOfLines={1}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 15, 10, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
  },
  message: {
    fontSize: 13.5,
    color: "#757575",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    width: "100%",
  },
  buttonsColumn: {
    flexDirection: "column",
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FB8C00",
    paddingHorizontal: 12,
  },
  buttonStacked: {
    flex: undefined,
    width: "100%",
  },
  buttonCancel: {
    backgroundColor: "#F0F0F0",
  },
  buttonDestructive: {
    backgroundColor: "#E53935",
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#FFFFFF",
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  buttonTextCancel: {
    color: "#616161",
  },
});
