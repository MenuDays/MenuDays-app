import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// TODO: conectar con un endpoint real de pedidos cuando exista el
// módulo en el backend (por ahora la tabla "pedidos" está en el
// schema de Prisma pero no tiene controller/service todavía).
export default function PedidosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Pedidos</Text>

      <View style={styles.emptyWrap}>
        <Ionicons name="receipt-outline" size={36} color="#D9D9D9" />
        <Text style={styles.emptyText}>Todavía no tenés pedidos.</Text>
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
});