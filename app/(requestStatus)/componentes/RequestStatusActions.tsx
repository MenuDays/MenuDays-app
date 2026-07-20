import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Status = "pendiente" | "aprobada" | "rechazada";

interface Props {
  status: Status;
}

interface ButtonConfig {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: readonly [string, string];
}

export default function RequestStatusActions({
  status,
}: Props) {
  const button = getButton(status);

  function handlePrimaryAction() {
    switch (status) {
      case "aprobada":
        router.replace("/(restaurant)/dashboard");
        break;

      case "rechazada":
        router.push("/(auth)/register-restaurant");
        break;

      case "pendiente":
      default:
        router.replace("/(home)");
        break;
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePrimaryAction}
      >
        <LinearGradient
          colors={button.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Ionicons
            name={button.icon}
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.primaryText}>
            {button.text}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        activeOpacity={0.85}
        onPress={() => router.push("/(home)/perfil")}
      >
        <Ionicons
          name="person-circle-outline"
          size={20}
          color="#757575"
        />

        <Text style={styles.secondaryText}>
          Mi perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function getButton(status: Status): ButtonConfig {
  switch (status) {
    case "aprobada":
      return {
        icon: "storefront",
        text: "Ir al Panel del Restaurante",
        colors: ["#4CAF50", "#2E7D32"] as const,
      };

    case "rechazada":
      return {
        icon: "create-outline",
        text: "Editar solicitud",
        colors: ["#FFB640", "#F58A07"] as const,
      };

    case "pendiente":
    default:
      return {
        icon: "home-outline",
        text: "Volver al inicio",
        colors: ["#FFB640", "#F58A07"] as const,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 40,
  },

  primaryButton: {
    height: 56,
    borderRadius: 28,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  secondaryButton: {
    marginTop: 14,
    height: 54,

    borderRadius: 16,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#ECECEC",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  secondaryText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#757575",
  },
});