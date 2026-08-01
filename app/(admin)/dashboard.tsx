import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import WaveTop from "../components/home/WaveTop";
import AdminBottomNav from "../components/admin/AdminBottomNav";
import OverviewCard from "../components/admin/OverviewCard";
import StatCard from "../components/admin/StatCard";
import RankingCard from "../components/admin/RankingCard";
import { StatCardData, RankingRow } from "../components/admin/types";

const { width } = Dimensions.get("screen");

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
    trend: "+8%",
    trendPositive: true,
  },
  {
    icon: "people",
    title: "Comensales",
    value: "1500",
    subtitle: "Registrados en total",
    trend: "+12%",
    trendPositive: true,
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
    trend: "+18%",
    trendPositive: true,
  },
  {
    icon: "alert-circle",
    title: "Reportes",
    value: "7",
    subtitle: "Registrados en total",
    trend: "3 nuevos",
    trendPositive: false,
  },
];

// Mock: reemplazar con data real del backend
const WEEKLY_REQUESTS = [4, 7, 5, 9, 6, 11, 8];
const WEEKLY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  // Pulso real de la pill "En vivo" — antes era decorativa, ahora
  // transmite que los datos se están actualizando de verdad.
  const livePulseAnim = useRef(new Animated.Value(1)).current;

  const cardAnims = useRef(
    STATS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  const rankingAnims = useRef([
    { opacity: new Animated.Value(0), translateY: new Animated.Value(18) },
    { opacity: new Animated.Value(0), translateY: new Animated.Value(18) },
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      Animated.timing(headerFadeAnim, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start();

    Animated.stagger(
      75,
      cardAnims.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      )
    ).start();

    Animated.stagger(
      120,
      rankingAnims.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      )
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulseAnim, {
          toValue: 1.3,
          duration: 850,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(livePulseAnim, {
          toValue: 1,
          duration: 850,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.headerWrapper}>
          <ImageBackground
            source={require("../../assets/images/restauranteHeader.png")}
            style={[styles.headerImage, { height: 190 + insets.top, paddingTop: insets.top + 16 }]}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)"]}
              style={StyleSheet.absoluteFill}
            />

            <Animated.View style={{ opacity: headerFadeAnim, gap: 4 }}>
              <Text style={styles.headerBrand}>MenuDays</Text>
              <Text style={styles.headerGreeting}>{greeting}</Text>
              <Text style={styles.headerWelcome}>Panel de administración</Text>
            </Animated.View>
          </ImageBackground>

          <View style={styles.waveWrapper}>
            <WaveTop />
          </View>
        </View>

        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <OverviewCard
            totalLabel="Solicitudes esta semana"
            totalValue={43}
            growthLabel="+18%"
            weeklyData={WEEKLY_REQUESTS}
            weeklyLabels={WEEKLY_LABELS}
            scaleAnim={heroScale}
          />

          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionEyebrow}>RESUMEN</Text>
              <Text style={styles.sectionTitle}>Vista general</Text>
            </View>

            <View style={styles.overviewPill}>
              <Animated.View style={{ transform: [{ scale: livePulseAnim }] }}>
                <Ionicons name="ellipse" size={8} color="#F5A800" />
              </Animated.View>
              <Text style={styles.overviewPillText}>En vivo</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {STATS.map((stat, i) => (
              <StatCard
                key={i}
                stat={stat}
                opacity={cardAnims[i].opacity}
                translateY={cardAnims[i].translateY}
              />
            ))}
          </View>

          <View style={styles.sectionHeadingRowRanking}>
            <Text style={styles.sectionEyebrow}>PERFORMANCE</Text>
            <Text style={styles.sectionTitle}>Restaurantes destacados</Text>
          </View>

          <Animated.View
            style={{ opacity: rankingAnims[0].opacity, transform: [{ translateY: rankingAnims[0].translateY }] }}
          >
            <RankingCard
              title="Top restaurantes por reportes"
              subtitle="Los que requieren mayor atención"
              icon="flag"
              color="#E53935"
              columnLabel="Reportes"
              linkText="Ver todos los reportes"
              data={TOP_REPORTS}
            />
          </Animated.View>

          <Animated.View
            style={{ opacity: rankingAnims[1].opacity, transform: [{ translateY: rankingAnims[1].translateY }] }}
          >
            <RankingCard
              title="Top restaurantes por reseñas"
              subtitle="Los que generan mayor actividad"
              icon="star"
              color="#F5A800"
              columnLabel="Reseñas"
              linkText="Ver todas las reseñas"
              data={TOP_REVIEWS}
            />
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <AdminBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 100 },
  headerWrapper: { width: width, position: "relative" },
  waveWrapper: { position: "absolute", bottom: 0, left: 0, right: 0 },
  headerImage: { width: width, justifyContent: "flex-start", paddingHorizontal: 20 },
  headerBrand: { fontSize: 15, fontWeight: "800", color: "rgba(255,255,255,0.85)", letterSpacing: 1 },
  headerGreeting: { fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: "500", marginTop: 8 },
  headerWelcome: { fontSize: 26, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.3 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 13,
  },
  sectionHeadingRowRanking: { marginTop: 8, marginBottom: 13 },
  sectionEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: "#B0B0B0", marginBottom: 3 },
  sectionTitle: { fontSize: 21, fontWeight: "900", color: "#1A1A1A" },
  overviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFF6E2",
  },
  overviewPillText: { fontSize: 10, fontWeight: "800", color: "#F5A800" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 25 },
});