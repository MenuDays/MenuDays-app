import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// TODO: conectar con un endpoint real de pedidos cuando exista el
// módulo en el backend
export default function PedidosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Pedidos</Text>

      <View style={styles.emptyWrap}>
        <Ionicons name="receipt-outline" size={36} color="#D9D9D9" />
        <Text style={styles.emptyText}>Todavía no tenés pedidos.</Text>

        {/* TODO: acceso temporal para probar el flujo mockeado de
            pedido-producto -> pedido-entrega -> pedido-confirmar.
            Sacar cuando exista un listado real de productos desde
            donde se entre a este flujo. */}
        <TouchableOpacity
          style={styles.mockButton}
          onPress={() => router.push("/(home)/pedido-producto")}
        >
          <Text style={styles.mockButtonText}>Probar flujo de pedido (mock)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#3E2723" },
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 13,
  },
  mockButton: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#FFA726",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  mockButtonText: {
    color: "#FB8C00",
    fontWeight: "700",
    fontSize: 13,
  },
});