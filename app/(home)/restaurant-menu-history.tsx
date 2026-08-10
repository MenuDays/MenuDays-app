import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RestaurantMenuHistoryScreen() {
  const { nombre } = useLocalSearchParams<{
    nombre?: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Histórico de menús{nombre ? ` · ${nombre}` : ""}
        </Text>

        {/* Espaciador para mantener el título centrado */}
        <View style={styles.roundButton} />
      </View>

      <View style={styles.emptyWrap}>
        <Ionicons name="time-outline" size={36} color="#D9D9D9" />

        <Text style={styles.emptyTitle}>Próximamente</Text>

        <Text style={styles.emptyText}>
          El histórico de menús todavía no está disponible para este
          restaurante.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginHorizontal: 8,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
  },

  emptyText: {
    fontSize: 13,
    color: "#9E9E9E",
    textAlign: "center",
    lineHeight: 19,
  },
});