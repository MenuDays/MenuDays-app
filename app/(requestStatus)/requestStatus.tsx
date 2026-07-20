import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RequestStatusCard from "./componentes/RequestStatusCard";
import RequestStatusHeader from "./componentes/RequestStatusHeader";
import RequestStatusInfo from "./componentes/RequestStatusInfo";
import RequestStatusTimeline from "./componentes/RequestStatusTimeline";

type Status = "PENDING" | "APPROVED" | "REJECTED";

export default function RequestStatusScreen() {
  const [loading, setLoading] = useState(true);

  const [status, setStatus] =
    useState<Status>("PENDING");

  const [restaurantName, setRestaurantName] =
    useState("Mi Restaurante");

  const [createdAt, setCreatedAt] =
    useState("20 de julio de 2026");

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      /**
       * Cuando esté listo el backend solamente reemplaza
       * estos valores por la respuesta del endpoint.
       */

      setStatus("PENDING");

      setRestaurantName("Mi Restaurante");

      setCreatedAt("20 de julio de 2026");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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
          restaurantName={restaurantName}
          status={status}
        />

        <RequestStatusTimeline
          status={status}
          createdAt={createdAt}
        />

        <RequestStatusInfo status={status} />
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