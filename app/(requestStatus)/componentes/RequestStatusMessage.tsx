import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface Props {
  status: "pendiente" | "aprobada" | "rechazada";
}

export default function RequestStatusMessage({
  status,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const config = {
    pendiente: {
      icon: "time-outline" as const,
      color: "#F5A800",
      background: "#FFF8E8",
      title: "Solicitud en revisión",
      message:
        "Estamos revisando la información de tu restaurante. Este proceso suele tardar entre 24 y 72 horas hábiles.",
    },

    aprobada: {
      icon: "checkmark-circle-outline" as const,
      color: "#2E7D32",
      background: "#EDF8EE",
      title: "¡Solicitud aprobada!",
      message:
        "¡Felicitaciones! Tu restaurante fue aprobado correctamente. Ya puedes ingresar al Panel del Restaurante y comenzar a administrar tus menús, promociones y perfil.",
    },

    rechazada: {
      icon: "close-circle-outline" as const,
      color: "#D32F2F",
      background: "#FDEEEE",
      title: "Solicitud rechazada",
      message:
        "Tu solicitud fue rechazada por el administrador. Revisa las observaciones recibidas, corrige la información y vuelve a enviar una nueva solicitud cuando lo desees.",
    },
  }[status];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.background,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: config.color,
          },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={28}
          color="#FFFFFF"
        />
      </View>

      <Text
        style={[
          styles.title,
          {
            color: config.color,
          },
        ]}
      >
        {config.title}
      </Text>

      <Text style={styles.message}>
        {config.message}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,

    padding: 22,

    borderRadius: 22,

    alignItems: "center",

    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  iconContainer: {
    width: 68,
    height: 68,

    borderRadius: 34,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",

    textAlign: "center",

    marginBottom: 10,
  },

  message: {
    fontSize: 15,
    lineHeight: 24,

    color: colors.textSecondary,

    textAlign: "center",
  },
});