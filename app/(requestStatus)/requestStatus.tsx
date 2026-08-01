import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import RestaurantRequestService from "../../services/restaurant-request.service";

import RequestStatusCard from "./componentes/RequestStatusCard";
import RequestStatusHeader from "./componentes/RequestStatusHeader";
import RequestStatusInfo from "./componentes/RequestStatusInfo";
import RequestStatusTimeline from "./componentes/RequestStatusTimeline";
import RequestStatusMessage from "./componentes/RequestStatusMessage";
import RequestStatusActions from "./componentes/RequestStatusActions";
import { AppAlert } from "../components/common/AppAlert";

type Status =
  | "pendiente"
  | "aprobada"
  | "rechazada";

export default function RequestStatusScreen() {
  const [loading, setLoading] = useState(true);

  const [status, setStatus] =
    useState<Status>("pendiente");

  const [restaurantName, setRestaurantName] =
    useState("");

  const [createdAt, setCreatedAt] =
    useState("");

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const response =
        await RestaurantRequestService.getStatus();

      setStatus(response.status);
      setRestaurantName(response.restaurantName);

      const date = new Date(response.requestDate);

      setCreatedAt(
        date.toLocaleDateString("es-EC", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );

      setLoading(false);
    } catch (error: any) {
      // 404 = el usuario todavía no tiene ninguna solicitud.
      // No es un error real: lo mandamos directo al formulario
      // en vez de dejarlo en esta pantalla con datos vacíos.
      const isNotFound =
        error?.message === "No se encontró ninguna solicitud registrada.";

      if (!isNotFound) {
        console.log(error);
        AppAlert.alert(
          "Solicitud",
          "No pudimos cargar el estado de tu solicitud. Intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      router.replace("/(auth)/register-restaurant");
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#F5A800"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <RequestStatusHeader />

        <RequestStatusCard
          status={status}
          restaurantName={restaurantName}
        />

        <RequestStatusTimeline
          status={status}
        />

        <RequestStatusInfo
          status={status}
        />

        <RequestStatusMessage
          status={status}
        />

        <RequestStatusActions
          status={status}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
  },

  content: {
    paddingBottom: 40,
  },
});