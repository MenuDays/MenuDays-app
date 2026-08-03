import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { router } from "expo-router";
import WaveTop from "../components/home/WaveTop";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import DishService from "../../services/dish.service";
import PromotionService from "../../services/promotion.service";
import RestaurantService from "../../services/restaurant.service";
import MenuService from "../../services/menu.service";
import { AppAlert } from "../components/common/AppAlert";

const { width } = Dimensions.get("screen");

// ============================================================
// DATA — mockeada, pero con el shape que ya esperarías del
// backend (GET /restaurants/:id/dashboard o similar). El día que
// conectes el fetch real, reemplazás estas constantes por el
// resultado de la llamada; el JSX no debería necesitar cambios.
// ============================================================

interface DailyVisit {
  day: string;
  value: number;
}

interface BreakdownItem {
  label: string;
  value: number;
  max: number;
  display: string;
  gradient: [string, string];
}

interface StatItem {
  icon: string;
  value: string;
  label: string;
  gradient: [string, string];
  trend: string | null;
}

interface QuickAccessItem {
  icon: string;
  label: string;
  sub: string;
  route: string;
  gradient: [string, string];
}

const RESTAURANT = {
  name: "Sabor Ecuatoriano",
  rating: 4.8,
};

// Visitas de los últimos 7 días — el último valor (hoy) coincide con el
// "247" que ya se muestra en el header y en la card hero
const WEEKLY_VISITS: DailyVisit[] = [
  { day: "L", value: 142 },
  { day: "M", value: 168 },
  { day: "X", value: 155 },
  { day: "J", value: 190 },
  { day: "V", value: 210 },
  { day: "S", value: 231 },
  { day: "D", value: 247 },
];

const TODAY_VISITS = WEEKLY_VISITS[WEEKLY_VISITS.length - 1].value;
const TODAY_TREND = "+18%";

// Desglose que reutiliza los mismos datos de la card de stats
// (reseñas, menús activos, platos) como barras comparativas
const BREAKDOWN: BreakdownItem[] = [
  { label: "Reseñas", value: 4.8, max: 5, display: "4.8", gradient: ["#FF9D42", "#F5751A"] },
  { label: "Promociones activas", value: 2, max: 5, display: "2", gradient: ["#FFC94D", "#F5A800"] },
  { label: "Platos registrados", value: 12, max: 20, display: "12", gradient: ["#FFA94D", "#F5871A"] },
];

// Grid 2x2 — cubre lo que necesitás ver como restaurante:
// platos registrados, promociones activas, pedidos pendientes
// (solo visual por ahora, sin backend detrás todavía) y reseñas.
const STATS: StatItem[] = [
  {
    icon: "list-outline",
    value: "12",
    label: "Platos registrados",
    gradient: ["#FFA94D", "#F5871A"],
    trend: null,
  },
  {
    icon: "pricetag-outline",
    value: "2",
    label: "Promociones activas",
    gradient: ["#FFC94D", "#F5A800"],
    trend: null,
  },
  {
    icon: "time-outline",
    value: "5",
    label: "Pedidos pendientes",
    gradient: ["#FFB800", "#F5A800"],
    trend: null,
  },
  {
    icon: "star",
    value: "4.8",
    label: "Reseñas",
    gradient: ["#FF9D42", "#F5751A"],
    trend: "+0.2",
  },
];

const QUICK_ACCESS: QuickAccessItem[] = [
  {
    icon: "fast-food-outline",
    label: "Platos",
    sub: "Tu carta completa",
    route: "/(restaurant)/platos",
    gradient: ["#FF9D42", "#F5751A"],
  },
  {
    icon: "images-outline",
    label: "Galería",
    sub: "Fotos del local",
    route: "/(restaurant)/gallery",
    gradient: ["#FF9D42", "#F5751A"],
  },
  {
    icon: "pricetag-outline",
    label: "Promociones",
    sub: "Ofertas activas",
    route: "/(restaurant)/promociones",
    gradient: ["#FFC94D", "#F5A800"],
  },
  {
    icon: "star-outline",
    label: "Reseñas",
    sub: "Lo que dicen",
    route: "/(restaurant)/resenas",
    gradient: ["#FFA94D", "#F5871A"],
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getInsightMessage(): string {
  const values = WEEKLY_VISITS.map((d) => d.value);
  const todayIsBest = TODAY_VISITS === Math.max(...values);
  if (todayIsBest) return "Este es tu mejor día de la semana 🎉";

  const yesterday = WEEKLY_VISITS[WEEKLY_VISITS.length - 2].value;
  if (TODAY_VISITS > yesterday) return "Vas mejor que ayer, seguí así";
  return "Un poco más tranquilo que ayer";
}

export default function RestaurantDashboard() {
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();
  const insightMessage = getInsightMessage();
  const [isOpen, setIsOpen] = React.useState(true);
  // Arranca en null ("todavía no sabemos") para no mostrar ni el estado
  // publicado ni el de "falta publicar" hasta tener la respuesta real.
  const [menuPublished, setMenuPublished] = React.useState<boolean | null>(null);

  useEffect(() => {
    async function loadTodayMenuStatus() {
      try {
        const menus = await MenuService.getAll();
        const today = new Date().toISOString().slice(0, 10);
        const todayMenu = menus.find(
          (menu) => menu.fecha_inicio.slice(0, 10) <= today && today <= menu.fecha_fin.slice(0, 10)
        );
        setMenuPublished(todayMenu?.estado === "publicado");
      } catch (e: any) {
        AppAlert.alert("Error", e.message || "No se pudo revisar el estado del menú de hoy.");
        setMenuPublished(false);
      }
    }

    loadTodayMenuStatus();
  }, []);

  // Platos registrados, promociones activas y reseñas ya tienen backend
  // real detrás -- se arrancan con el shape mockeado (para que el layout
  // y las animaciones no salten) y se pisan al llegar la respuesta.
  // "Pedidos pendientes" se deja mockeado: todavía no existe el módulo
  // de pedidos en el backend.
  const [stats, setStats] = React.useState<StatItem[]>(STATS);
  const [breakdown, setBreakdown] = React.useState<BreakdownItem[]>(BREAKDOWN);

  useEffect(() => {
    async function loadRealStats() {
      try {
        const [dishes, promotions, profile] = await Promise.all([
          DishService.getAll(),
          PromotionService.getAll(),
          RestaurantService.getProfile(),
        ]);

        const dishesCount = dishes.length;
        const activePromotions = promotions.filter((p) => p.activa).length;
        const rating = Number(profile.calificacion_promedio ?? 0);

        setStats((prev) =>
          prev.map((stat) => {
            if (stat.label === "Platos registrados") {
              return { ...stat, value: String(dishesCount) };
            }
            if (stat.label === "Promociones activas") {
              return { ...stat, value: String(activePromotions) };
            }
            if (stat.label === "Reseñas") {
              return { ...stat, value: rating.toFixed(1) };
            }
            return stat;
          })
        );

        setBreakdown((prev) =>
          prev.map((item) => {
            if (item.label === "Reseñas") {
              return { ...item, value: rating, display: rating.toFixed(1) };
            }
            if (item.label === "Promociones activas") {
              return { ...item, value: activePromotions, display: String(activePromotions) };
            }
            if (item.label === "Platos registrados") {
              return { ...item, value: dishesCount, display: String(dishesCount) };
            }
            return item;
          })
        );
      } catch (e: any) {
        AppAlert.alert("Error", e.message || "No se pudieron cargar las estadísticas.");
      }
    }

    loadRealStats();
  }, []);

  // ------- Animaciones de entrada -------
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;

  const cardAnims = useRef(
    STATS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  const chartAnim = useRef({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(18),
  }).current;

  const quickAnims = useRef(
    QUICK_ACCESS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(18),
    }))
  ).current;

  const headerStatsAnim = useRef(new Animated.Value(0)).current;

  // Pulso continuo del ícono de tendencia en el header
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      Animated.timing(headerStatsAnim, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
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

    Animated.timing(chartAnim.opacity, {
      toValue: 1,
      duration: 500,
      delay: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(chartAnim.translateY, {
      toValue: 0,
      duration: 500,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      70,
      quickAnims.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      )
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header con foto del restaurante */}
        <View style={styles.headerWrapper}>
          <ImageBackground
            source={require("../../assets/images/restauranteHeader.png")}
            style={[
              styles.headerImage,
              {
                height: 230 + insets.top,
                paddingTop: insets.top + 16,
              },
            ]}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)"]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.headerTopRow}>
              <Text style={styles.headerBrand}>MenuDays</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsOpen((prev) => !prev)}
                style={[
                  styles.statusPill,
                  { backgroundColor: isOpen ? "rgba(47,185,102,0.9)" : "rgba(158,158,158,0.55)" },
                ]}
              >
                {isOpen && (
                  <Animated.View style={[styles.statusDot, { transform: [{ scale: pulseAnim }] }]} />
                )}
                {!isOpen && <View style={[styles.statusDot, { backgroundColor: "#E0E0E0" }]} />}
                <Text style={styles.statusPillText}>{isOpen ? "Abierto" : "Cerrado"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.headerGreeting}>{greeting} 👋</Text>
              <Text style={styles.headerRestaurantName}>{RESTAURANT.name}</Text>

              <Animated.View
                style={[
                  styles.headerStatsRow,
                  {
                    opacity: headerStatsAnim,
                    transform: [
                      {
                        translateY: headerStatsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.headerStatPill}>
                  <Ionicons name="star" size={13} color="#FFD54D" />
                  <Text style={styles.headerStatText}>{RESTAURANT.rating}</Text>
                </View>
              </Animated.View>
            </View>
          </ImageBackground>

          <View style={styles.waveWrapper}>
            <WaveTop />
          </View>
        </View>

        {/* Contenido */}
        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >

          {/* Menú del día: publicado o no -- esto lo necesitás ver
              y poder resolver de un toque, no es solo un dato más.
              Mientras se confirma el estado real (menuPublished === null)
              se muestra en gris; el toque siempre lleva a /menu, tanto
              para revisarlo como para publicarlo. */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(restaurant)/menu" as any)}
            style={[
              styles.menuStatusCard,
              { borderLeftColor: menuPublished === null ? "#C9C9C9" : menuPublished ? "#2FB966" : "#E53935" },
            ]}
          >
            <View
              style={[
                styles.menuStatusIcon,
                { backgroundColor: menuPublished === null ? "#F5F5F5" : menuPublished ? "#E9FBF1" : "#FFEBEE" },
              ]}
            >
              <Ionicons
                name={menuPublished === null ? "time-outline" : menuPublished ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={menuPublished === null ? "#9E9E9E" : menuPublished ? "#2FB966" : "#E53935"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuStatusTitle}>
                {menuPublished === null
                  ? "Revisando el menú de hoy..."
                  : menuPublished
                  ? "Menú de hoy publicado"
                  : "Todavía no publicaste el menú de hoy"}
              </Text>
              <Text style={styles.menuStatusSub}>
                {menuPublished === null
                  ? "Un momento"
                  : menuPublished
                  ? "Tus clientes ya pueden verlo"
                  : "Tocá para revisarlo"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9C9C9" />
          </TouchableOpacity>

          {/* Stats 2x2 */}
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.statCard,
                  { borderLeftColor: stat.gradient[1] },
                  {
                    opacity: cardAnims[i].opacity,
                    transform: [{ translateY: cardAnims[i].translateY }],
                  },
                ]}
              >
                <View style={styles.statTopRow}>
                  <LinearGradient
                    colors={stat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statIconBadge}
                  >
                    <Ionicons name={stat.icon as any} size={18} color="#FFFFFF" />
                  </LinearGradient>
                  {stat.trend && (
                    <View style={styles.trendPill}>
                      <Ionicons name="trending-up" size={10} color="#2FB966" />
                      <Text style={styles.trendText}>{stat.trend}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Estadísticas */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Estadísticas</Text>
            <View style={styles.sectionTag}>
              <Text style={styles.sectionTagText}>Últimos 7 días</Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.chartCard,
              { opacity: chartAnim.opacity, transform: [{ translateY: chartAnim.translateY }] },
            ]}
          >
            <BarChart data={WEEKLY_VISITS} />

            <View style={styles.divider} />

            {breakdown.map((item, i) => (
              <BreakdownRow key={i} item={item} delay={i * 90} />
            ))}
          </Animated.View>

          {/* Accesos rápidos */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            <Text style={styles.sectionLink}>Ver todo</Text>
          </View>

          <View style={styles.quickGrid}>
            {QUICK_ACCESS.map((item, i) => (
              <QuickAccessCard
                key={i}
                item={item}
                opacity={quickAnims[i].opacity}
                translateY={quickAnims[i].translateY}
              />
            ))}
          </View>

        </Animated.View>
      </ScrollView>

      {/* Nav bar */}
      <RestaurantBottomNav />

    </View>
  );
}

// ============================================================
// Sub-componentes
// ============================================================

function QuickAccessCard({
  item,
  opacity,
  translateY,
}: {
  item: QuickAccessItem;
  opacity: Animated.Value;
  translateY: Animated.Value;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(pressScale, { toValue: 0.95, friction: 6, useNativeDriver: true }).start();
  }
  function onPressOut() {
    Animated.spring(pressScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale: pressScale }] }}>
      <TouchableOpacity
        style={[styles.quickCard, { borderLeftColor: item.gradient[1] }]}
        onPress={() => router.push(item.route as any)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.92}
      >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickIconBadge}
        >
          <Ionicons name={item.icon as any} size={22} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.quickLabel}>{item.label}</Text>
        <Text style={styles.quickSub}>{item.sub}</Text>
        <View style={styles.quickArrow}>
          <Ionicons name="chevron-forward" size={14} color="#C9C9C9" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function BreakdownRow({ item, delay }: { item: BreakdownItem; delay: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const targetWidth = Math.min(100, (item.value / item.max) * 100);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: targetWidth,
      duration: 700,
      delay: 300 + delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLabelRow}>
        <Text style={styles.breakdownLabel}>{item.label}</Text>
        <Text style={styles.breakdownValue}>{item.display}</Text>
      </View>
      <View style={styles.breakdownTrack}>
        <Animated.View
          style={[
            styles.breakdownFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

function BarChart({ data }: { data: DailyVisit[] }) {
  const chartWidth = width - 32 - 36;
  const chartHeight = 110;
  const barGap = 10;
  const barWidth = (chartWidth - barGap * (data.length - 1)) / data.length;
  const maxValue = Math.max(...data.map((d) => d.value));

  const barAnims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      60,
      barAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: (data[i].value / maxValue) * chartHeight,
          duration: 550,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  }, []);

  return (
    <View style={styles.barChartWrapper}>
      <View style={{ width: chartWidth, height: chartHeight, flexDirection: "row", alignItems: "flex-end" }}>
        <Svg width={0} height={0}>
          <Defs>
            <SvgGradient id="unused" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFB800" />
              <Stop offset="1" stopColor="#F5A800" />
            </SvgGradient>
          </Defs>
        </Svg>
        {data.map((item, i) => {
          const isLast = i === data.length - 1;
          return (
            <Animated.View
              key={i}
              style={{
                width: barWidth,
                height: barAnims[i],
                marginRight: i === data.length - 1 ? 0 : barGap,
                borderRadius: 7,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={isLast ? ["#FF8A1F", "#F5751A"] : ["#FFB800", "#F5A800"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          );
        })}
      </View>
      <View style={[styles.barChartLabels, { width: chartWidth }]}>
        {data.map((item, i) => (
          <Text
            key={i}
            style={[
              styles.barChartDayLabel,
              i === data.length - 1 && styles.barChartDayLabelActive,
            ]}
          >
            {item.day}
          </Text>
        ))}
      </View>
    </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBrand: {
    fontSize: 15,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  statusPillText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  headerContent: {
    gap: 3,
    paddingBottom: 34,
  },
  headerGreeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  headerRestaurantName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  headerStatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerStatText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  /* ------- Contenido ------- */
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: "#F5751A",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  heroValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  heroTrendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  heroTrendText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginVertical: 12,
  },
  heroMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 26,
  },
  menuStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFAF2",
    borderRadius: 16,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  menuStatusIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuStatusTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  menuStatusSub: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 2,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: "#FFFAF2",
    borderRadius: 18,
    borderLeftWidth: 4,
    padding: 16,
    paddingLeft: 13,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F5A800",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9FBF1",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  trendText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#2FB966",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1A1A",
    marginTop: 12,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12.5,
    color: "#9E9E9E",
    marginTop: 2,
    fontWeight: "500",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F5A800",
  },
  sectionTag: {
    backgroundColor: "#FFF4DE",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionTagText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#B87A00",
  },

  /* ------- Estadísticas ------- */
  chartCard: {
    backgroundColor: "#FFFAF2",
    borderRadius: 20,
    padding: 18,
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  barChartWrapper: {
    alignItems: "center",
  },
  barChartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  barChartDayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C2C2C2",
    textAlign: "center",
  },
  barChartDayLabelActive: {
    color: "#F5A800",
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1E7D8",
    marginVertical: 16,
  },
  breakdownRow: {
    marginBottom: 14,
  },
  breakdownLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5C5C5C",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  breakdownTrack: {
    height: 8,
    borderRadius: 5,
    backgroundColor: "#F3ECE0",
    overflow: "hidden",
  },
  breakdownFill: {
    height: 8,
    borderRadius: 5,
    overflow: "hidden",
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: (width - 44) / 2,
    backgroundColor: "#FFFAF2",
    borderRadius: 18,
    borderLeftWidth: 4,
    padding: 18,
    paddingLeft: 15,
    gap: 3,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    minHeight: 118,
    position: "relative",
    overflow: "hidden",
  },
  quickIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#F5A800",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  quickLabel: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  quickSub: {
    fontSize: 11.5,
    color: "#B0B0B0",
    fontWeight: "500",
  },
  quickArrow: {
    position: "absolute",
    top: 16,
    right: 14,
  },
});