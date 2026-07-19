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

type Breakdown = { label: string; value: number; color: string };

type StatCardData = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  breakdown?: Breakdown[];
  subtitle?: string;
};

const STATS: StatCardData[] = [
  {
    icon: "restaurant",
    title: "Restaurantes",
    value: "35",
    breakdown: [
      { label: "Activos", value: 30, color: "#4CAF50" },
      { label: "Suspendidos", value: 2, color: "#F5A800" },
      { label: "Eliminados", value: 3, color: "#E53935" },
    ],
  },
  {
    icon: "people",
    title: "Comensales",
    value: "1500",
    subtitle: "Registrados en total",
  },
  {
    icon: "clipboard",
    title: "Solicitudes",
    value: "43",
    breakdown: [
      { label: "Aceptadas", value: 35, color: "#4CAF50" },
      { label: "Pendientes", value: 1, color: "#F5A800" },
      { label: "Rechazadas", value: 7, color: "#E53935" },
    ],
  },
  {
    icon: "alert-circle",
    title: "Reportes",
    value: "7",
    subtitle: "Registrados en total",
  },
];

type RankingRow = { position: number; name: string; value: number };

const TOP_REPORTS: RankingRow[] = [
  { position: 1, name: "Restaurante", value: 7 },
  { position: 2, name: "Restaurante", value: 5 },
  { position: 3, name: "Restaurante", value: 4 },
  { position: 4, name: "Restaurante", value: 3 },
  { position: 5, name: "Restaurante", value: 3 },
];

const TOP_REVIEWS: RankingRow[] = [
  { position: 1, name: "Restaurante", value: 100 },
  { position: 2, name: "Restaurante", value: 250 },
  { position: 3, name: "Restaurante", value: 150 },
  { position: 4, name: "Restaurante", value: 70 },
  { position: 5, name: "Restaurante", value: 113 },
];

const RANK_COLORS = ["#F5A800", "#1A1A1A", "#E53935", "#F5C518", "#BDBDBD"];

const NAV_ITEMS = [
  { icon: "home" as const, label: "Inicio", route: "/(admin)/dashboard" },
  { icon: "clipboard-outline" as const, label: "Solicitudes", route: "/(admin)/solicitudes" },
  { icon: "shield-checkmark-outline" as const, label: "Moderación", route: "/(admin)/moderacion" },
  { icon: "person-outline" as const, label: "Perfil", route: "/(admin)/perfil" },
];

export default function AdminDashboard() {
  // insets.top = alto real de la barra de estado en este dispositivo
  const insets = useSafeAreaInsets();

  return (
    // View normal en vez de SafeAreaView: dejamos que el header naranja
    // pinte hasta el borde superior real de la pantalla (full-bleed)
    <View style={styles.container}>
      {/* Iconos de la barra de estado en blanco, para que combinen con el naranja */}
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header con imagen (mismo patrón que RestaurantDashboard) */}
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
              <Text style={styles.headerWelcome}>¡Bienvenido, Admin!</Text>
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

          {/* Stats 2x2 con desglose */}
          <View style={styles.statsGrid}>
            {STATS.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={styles.statIconCircle}>
                  <Ionicons name={stat.icon} size={20} color="#FFFFFF" />
                </View>

                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>

                {stat.breakdown ? (
                  <View style={styles.breakdownList}>
                    {stat.breakdown.map((b, j) => (
                      <View key={j} style={styles.breakdownRow}>
                        <View style={styles.breakdownLeft}>
                          <View
                            style={[
                              styles.breakdownDot,
                              { backgroundColor: b.color },
                            ]}
                          />
                          <Text style={styles.breakdownLabel}>{b.label}</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{b.value}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Ranking de restaurantes */}
          <Text style={styles.sectionTitleCentered}>
            Ranking de restaurantes
          </Text>

          <RankingCard
            title="Top restaurantes por reportes"
            color="#E53935"
            columnLabel="Reportes"
            linkText="Ver todos los reportes"
            data={TOP_REPORTS}
          />

          <RankingCard
            title="Top restaurantes por Reseñas"
            color="#F5A800"
            columnLabel="Reseñas"
            linkText="Ver todas las reseñas"
            data={TOP_REVIEWS}
          />

        </View>
      </ScrollView>

      {/* Nav bar */}
      <SafeAreaView edges={["bottom"]} style={styles.navBarSafeArea}>
        <View style={styles.navBar}>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              active={item.route === "/(admin)/dashboard"}
              onPress={() => router.push(item.route as any)}
            />
          ))}
        </View>
      </SafeAreaView>

    </View>
  );
}

function RankingCard({
  title,
  color,
  columnLabel,
  linkText,
  data,
}: {
  title: string;
  color: string;
  columnLabel: string;
  linkText: string;
  data: RankingRow[];
}) {
  return (
    <View style={styles.rankingCard}>
      <View style={[styles.rankingHeader, { backgroundColor: color }]}>
        <Ionicons name="flag" size={16} color="#FFFFFF" />
        <Text style={styles.rankingHeaderText}>{title}</Text>
      </View>

      <View style={styles.rankingBody}>
        <View style={styles.rankingTableHeader}>
          <Text style={styles.rankingTableHeaderCol}>#</Text>
          <Text style={[styles.rankingTableHeaderCol, styles.rankingNameCol]}>
            Restaurante
          </Text>
          <Text style={styles.rankingTableHeaderCol}>{columnLabel}</Text>
        </View>

        {data.map((row) => (
          <View key={row.position} style={styles.rankingRow}>
            <View style={styles.rankingPositionCell}>
              <View
                style={[
                  styles.rankingBadge,
                  {
                    backgroundColor:
                      RANK_COLORS[(row.position - 1) % RANK_COLORS.length],
                  },
                ]}
              >
                <Ionicons name="restaurant" size={11} color="#FFFFFF" />
              </View>
              <Text style={styles.rankingPositionText}>{row.position}</Text>
            </View>
            <Text style={[styles.rankingName, styles.rankingNameCol]}>
              {row.name}
            </Text>
            <Text style={styles.rankingValue}>{row.value}</Text>
          </View>
        ))}

        <TouchableOpacity>
          <Text style={[styles.rankingLink, { color }]}>{linkText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons
        name={icon}
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
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
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
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5A800",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F5A800",
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 6,
  },
  breakdownList: {
    marginTop: 10,
    gap: 4,
    width: "100%",
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  breakdownLabel: {
    fontSize: 11,
    color: "#757575",
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Section title
  sectionTitleCentered: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
  },

  // Ranking cards
  rankingCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  rankingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rankingHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  rankingBody: {
    padding: 16,
  },
  rankingTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rankingTableHeaderCol: {
    fontSize: 11,
    color: "#9E9E9E",
    width: 60,
  },
  rankingNameCol: {
    flex: 1,
    width: undefined,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  rankingPositionCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 60,
  },
  rankingBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rankingPositionText: {
    fontSize: 13,
    color: "#1A1A1A",
  },
  rankingName: {
    fontSize: 13,
    color: "#1A1A1A",
  },
  rankingValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    width: 60,
    textAlign: "right",
  },
  rankingLink: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },

  // Nav bar
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