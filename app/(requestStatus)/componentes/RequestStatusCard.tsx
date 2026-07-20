import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

export type RequestStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada";

interface RequestStatusCardProps {
  status: RequestStatus;
  restaurantName: string;
}

export default function RequestStatusCard({
  status,
  restaurantName,
}: RequestStatusCardProps) {
  const config = getStatusConfig(status);

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: config.background,
          },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={46}
          color={config.color}
        />
      </View>

      <Text
        style={[
          styles.status,
          {
            color: config.color,
          },
        ]}
      >
        {config.title}
      </Text>

      <Text style={styles.restaurantName}>
        {restaurantName}
      </Text>

      <Text style={styles.description}>
        {config.description}
      </Text>
    </View>
  );
}

function getStatusConfig(status: RequestStatus) {
  switch (status) {
    case "aprobada":
      return {
        title: "Solicitud aprobada",
        description:
          "¡Felicitaciones! Tu restaurante fue aprobado correctamente y ya puedes comenzar a administrar tus menús en MenuDays.",
        color: "#43A047",
        background: "#E8F5E9",
        icon: "checkmark-circle" as const,
      };

    case "rechazada":
      return {
        title: "Solicitud rechazada",
        description:
          "Nuestro equipo encontró información que necesita corregirse. Revisa tu solicitud y vuelve a enviarla cuando desees.",
        color: "#E53935",
        background: "#FDECEC",
        icon: "close-circle" as const,
      };

    case "pendiente":
    default:
      return {
        title: "Solicitud pendiente",
        description:
          "Estamos revisando la información enviada. Este proceso normalmente tarda entre 24 y 48 horas hábiles.",
        color: "#F5A800",
        background: "#FFF8E6",
        icon: "time" as const,
      };
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",

    marginHorizontal: 20,
    marginTop: 24,

    paddingVertical: 28,
    paddingHorizontal: 22,

    borderRadius: 22,

    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  iconContainer: {
    width: 92,
    height: 92,

    borderRadius: 46,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 20,
  },

  status: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  restaurantName: {
    marginTop: 10,

    fontSize: 18,
    fontWeight: "700",

    color: "#1A1A1A",

    textAlign: "center",
  },

  description: {
    marginTop: 14,

    fontSize: 15,
    lineHeight: 24,

    color: "#666666",

    textAlign: "center",
  },
});