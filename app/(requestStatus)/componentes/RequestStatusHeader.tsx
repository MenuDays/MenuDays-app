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
import { SafeAreaView } from "react-native-safe-area-context";

interface RequestStatusHeaderProps {
  title?: string;
}

export default function RequestStatusHeader({
  title = "Estado de la solicitud",
}: RequestStatusHeaderProps) {
  return (
    <LinearGradient
      colors={["#FFB640", "#F58A07"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <SafeAreaView edges={["top"]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </Text>

          <View style={styles.placeholder} />
        </View>

        <Text style={styles.subtitle}>
          Consulta el estado actual de tu solicitud para convertirte en
          restaurante.
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingTop: 10,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: "rgba(255,255,255,0.18)",

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    marginHorizontal: 10,

    textAlign: "center",

    fontSize: 20,
    fontWeight: "700",

    color: "#FFFFFF",
  },

  placeholder: {
    width: 44,
  },

  subtitle: {
    marginTop: 18,
    paddingHorizontal: 28,

    textAlign: "center",

    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",

    color: "rgba(255,255,255,0.92)",
  },
});