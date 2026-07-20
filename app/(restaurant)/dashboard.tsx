import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import WaveTop from "../components/home/WaveTop";

const { width } = Dimensions.get("screen");

const STATS = [
  { icon: "eye-outline", value: "247", label: "Visitas de hoy", color: "#F5A800" },
  { icon: "star", value: "4.8", label: "Reseñas", color: "#F5A800" },
  { icon: "restaurant-outline", value: "3", label: "Menús activos", color: "#F5A800" },
  { icon: "list-outline", value: "12", label: "Platos", color: "#F5A800" },
];

const QUICK_ACCESS = [
  { icon: "restaurant-outline", label: "Menú del día", route: "/(restaurant)/menu" },
  { icon: "images-outline", label: "Galería", route: "/(restaurant)/galeria" },
  { icon: "pricetag-outline", label: "Promociones", route: "/(restaurant)/promociones" },
  { icon: "star-outline", label: "Reseñas", route: "/(restaurant)/resenas" },
];

export default function RestaurantDashboard() {
  // insets.top = alto real de la barra de estado en este dispositivo
  const insets = useSafeAreaInsets();

  return (
    // View normal en vez de SafeAreaView: dejamos que el header naranja
    // pinte hasta el borde superior real de la pantalla (full-bleed)
    <View style={styles.container}>
      {/* Iconos de la barra de estado en blanco, para que combinen con el naranja */}
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header con imagen */}
        <View style={styles.headerWrapper}>
          <ImageBackground
            source={require("../../assets/images/restauranteHeader.png")}
            style={[
              styles.headerImage,
              {
                // el header crece exactamente lo que mide la barra de estado,
                // así queda naranja también detrás del reloj/batería
                height: 190 + insets.top,
                paddingTop: insets.top + 16,
              },
            ]}
            resizeMode="cover"
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerBrand}>MenuDays</Text>
              <Text style={styles.headerWelcome}>
                ¡Bienvenido, Sabor Ecuatoriano!
              </Text>
            </View>
          </ImageBackground>

          {/* Onda blanca reutilizada, anclada siempre al borde inferior real
              del header (no importa cuánto mida el header en cada equipo) */}
          <View style={styles.waveWrapper}>
            <WaveTop />
          </View>
        </View>

        {/* Contenido */}
        <View style={styles.content}>

          {/* Estado del local */}
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Estado del local</Text>
            <TouchableOpacity style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Abierto</Text>
            </TouchableOpacity>
          </View>

          {/* Stats 2x2 */}
          <View style={styles.statsGrid}>
            {STATS.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <Ionicons
                  name={stat.icon as any}
                  size={22}
                  color={stat.color}
                />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Accesos rápidos */}
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>

          <View style={styles.quickGrid}>
            {QUICK_ACCESS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={item.icon as any}
                  size={28}
                  color="#F5A800"
                />
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>
      </ScrollView>

      {/* Nav bar */}
      <SafeAreaView edges={["bottom"]} style={styles.navBarSafeArea}>
        <View style={styles.navBar}>
          <NavItem icon="home" label="Inicio" active />
          <NavItem icon="restaurant-outline" label="Menús" />
          <NavItem icon="storefront-outline" label="Mi Local" />
          <NavItem icon="person-outline" label="Perfil" />
        </View>
      </SafeAreaView>

    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.navItem}>
      <Ionicons
        name={icon as any}
        size={24}
        color={active ? "#F5A800" : "#9E9E9E"}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerWrapper: {
    width: width,
    position: "relative",
  },
  waveWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  headerImage: {
    width: width,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 4,
  },
  headerBrand: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerWelcome: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4CAF50",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F5A800",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 14,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: (width - 44) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 100,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  navBarSafeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#F5A800",
    fontWeight: "700",
  },
});