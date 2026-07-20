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

export default function EditProfileHeader() {
  return (
    <LinearGradient
      colors={["#FFB640", "#F58A07"]}
      style={styles.header}
    >
      <SafeAreaView edges={["top"]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Editar perfil
          </Text>

          {/* Espacio para centrar el título */}
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingTop: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,

    backgroundColor: "rgba(255,255,255,0.18)",

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    textAlign: "center",

    fontSize: 20,
    fontWeight: "700",

    color: "#FFFFFF",
  },

  placeholder: {
    width: 42,
  },
});