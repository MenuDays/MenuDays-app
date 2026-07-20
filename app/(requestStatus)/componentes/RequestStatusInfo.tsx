import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  status: "pendiente" | "aprobada" | "rechazada";
}

export default function RequestStatusInfo({
  status,
}: Props) {
  const info = getInfo(status);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: info.background,
          },
        ]}
      >
        <Ionicons
          name={info.icon}
          size={30}
          color={info.color}
        />
      </View>

      <Text style={styles.title}>
        {info.title}
      </Text>

      <Text style={styles.description}>
        {info.description}
      </Text>
    </View>
  );
}

function getInfo(status: Props["status"]) {
  switch (status) {
    case "aprobada":
      return {
        icon: "checkmark-circle" as const,
        color: "#43A047",
        background: "#E8F5E9",

        title: "¡Solicitud aprobada!",

        description:
          "¡Felicitaciones! Tu restaurante ya forma parte de MenuDays. Ahora puedes acceder al Panel del Restaurante, administrar tus menús, promociones y comenzar a recibir nuevos clientes.",
      };

    case "rechazada":
      return {
        icon: "close-circle" as const,
        color: "#E53935",
        background: "#FDECEC",

        title: "Solicitud rechazada",

        description:
          "Tu solicitud fue rechazada por el administrador. Revisa las observaciones recibidas, corrige la información y vuelve a enviar una nueva solicitud cuando lo desees.",
      };

    case "pendiente":
    default:
      return {
        icon: "time" as const,
        color: "#F5A800",
        background: "#FFF8E8",

        title: "Solicitud en revisión",

        description:
          "Nuestro equipo está verificando la información enviada. Este proceso normalmente demora entre 24 y 72 horas hábiles. Te notificaremos cuando exista una respuesta.",
      };
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 22,

    backgroundColor: "#FFFFFF",

    borderRadius: 22,

    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 18,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",

    color: "#1A1A1A",

    textAlign: "center",

    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,

    color: "#666666",

    textAlign: "center",
  },
});