import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  useSafeAreaInsets
} from "react-native-safe-area-context";
import DishService from "../../services/dish.service";
import MenuService from "../../services/menu.service";
import PromotionService from "../../services/promotion.service";
import RestaurantService from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
const platosBg = require("../../assets/dashboard/platos.png");
const promocionesBg = require("../../assets/dashboard/promociones.png");
const menusBg = require("../../assets/dashboard/menus.png");
const galeriaBg = require("../../assets/dashboard/galeria.png");
const heroBg = require("../../assets/dashboard/hero-restaurante.png");
const menuReminderCharacter = require("../../assets/characters/niñoPensando.png");

const { width } = Dimensions.get("screen");

// ============================================================
// DATA — mockeada, pero con el shape que ya esperarías del
// backend (GET /restaurants/:id/dashboard o similar). El día que
// conectes el fetch real, reemplazás estas constantes por el
// resultado de la llamada; el JSX no debería necesitar cambios.
// ============================================================


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
  image: any;
}
const STATS: StatItem[] = [
  {
    icon: "list-outline",
    value: "0",
    label: "Platos registrados",
    gradient: ["#FFA94D", "#F5871A"],
    trend: null,
  },
  {
    icon: "pricetag-outline",
    value: "0",
    label: "Promociones activas",
    gradient: ["#FFC94D", "#F5A800"],
    trend: null,
  },
  {
    icon: "time-outline",
    value: "0",
    label: "Pedidos pendientes",
    gradient: ["#FFB800", "#F5A800"],
    trend: null,
  },
  {
    icon: "star",
    value: "0.0",
    label: "Reseñas",
    gradient: ["#FF9D42", "#F5751A"],
    trend: null,
  },
];

const BREAKDOWN: BreakdownItem[] = [
  {
    label: "Reseñas",
    value: 0,
    max: 5,
    display: "0.0",
    gradient: ["#FF9D42", "#F5751A"],
  },
  {
    label: "Promociones activas",
    value: 0,
    max: 5,
    display: "0",
    gradient: ["#FFC94D", "#F5A800"],
  },
  {
    label: "Platos registrados",
    value: 0,
    max: 20,
    display: "0",
    gradient: ["#FFA94D", "#F5871A"],
  },
];
const QUICK_ACCESS: QuickAccessItem[] = [
  {
    icon: "fast-food-outline",
    label: "Platos",
    sub: "Gestionar platos",
    route: "/(restaurant)/platos",
    gradient: ["#FF9D42", "#F5751A"],
    image: platosBg,
  },
  {
    icon: "pricetag-outline",
    label: "Promociones",
    sub: "Crear y administrar",
    route: "/(restaurant)/promociones",
    gradient: ["#FFC94D", "#F5A800"],
    image: promocionesBg,
  },
  {
    icon: "restaurant-outline",
    label: "Menús del día",
    sub: "Crear menús",
    route: "/(restaurant)/menu",
    gradient: ["#FF9D42", "#F5751A"],
    image: menusBg,
  },
  {
    icon: "images-outline",
    label: "Galería",
    sub: "Fotos del local",
    route: "/(restaurant)/gallery",
    gradient: ["#FF9D42", "#F5751A"],
    image: galeriaBg,
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function RestaurantDashboard() {
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();
  // Arranca en null ("todavía no sabemos") para no mostrar ni el estado
  // publicado ni el de "falta publicar" hasta tener la respuesta real.
  const [menuPublished, setMenuPublished] = React.useState<boolean | null>(null);
  const [showMenuReminder, setShowMenuReminder] = React.useState(true);
  const [restaurant, setRestaurant] = React.useState({
  name: "",
  rating: 0,
});
  const [showDashboardMenu, setShowDashboardMenu] = React.useState(false);


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
        setRestaurant({
  name: profile.nombre_comercial ?? "",
  rating,
});

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
      cardAnims.map((anim: {
  opacity: Animated.Value;
  translateY: Animated.Value;
}) =>
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

    
  }, []);

  return (
    <ImageBackground
      source={heroBg}
      resizeMode="cover"
      style={styles.dashboardBackground}
      imageStyle={styles.dashboardBackgroundImage}
    >
      {/* Todo el dashboard vive sobre la imagen hero de fondo. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.dashboardScrollContent,
          { paddingTop: insets.top + 22 },
        ]}
      >
        <View style={styles.dashboardMenuWrapper}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setShowDashboardMenu((prev) => !prev)}
            style={styles.dashboardMenuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showDashboardMenu ? "close" : "menu-outline"}
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {showDashboardMenu && (
            <View style={styles.dashboardDropdown}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.dashboardDropdownItem}
                onPress={() => {
                  setShowDashboardMenu(false);
                  router.push("/(restaurant)/menu" as any);
                }}
              >
                <Ionicons name="restaurant-outline" size={18} color="#F5751A" />
                <Text style={styles.dashboardDropdownText}>Menús del día</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.dashboardDropdownItem}
                onPress={() => {
                  setShowDashboardMenu(false);
                  router.push("/(restaurant)/platos" as any);
                }}
              >
                <Ionicons name="fast-food-outline" size={18} color="#F5751A" />
                <Text style={styles.dashboardDropdownText}>Platos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.dashboardDropdownItem}
                onPress={() => {
                  setShowDashboardMenu(false);
                  router.push("/(restaurant)/promociones" as any);
                }}
              >
                <Ionicons name="pricetag-outline" size={18} color="#F5751A" />
                <Text style={styles.dashboardDropdownText}>Promociones</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.dashboardDropdownItem}
                onPress={() => {
                  setShowDashboardMenu(false);
                  router.push("/(restaurant)/gallery" as any);
                }}
              >
                <Ionicons name="images-outline" size={18} color="#F5751A" />
                <Text style={styles.dashboardDropdownText}>Galería</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* RESUMEN DEL RESTAURANTE */}
          <View style={styles.heroIntro}>
            <View style={styles.heroIntroText}>
              <Text style={styles.heroGreeting}>{greeting},</Text>

              <Text style={styles.heroRestaurantName}>
                {restaurant.name || "Tu restaurante"}!
              </Text>

              <Text style={styles.heroDescription}>
                Aquí tienes un resumen de tu{"\n"}
                restaurante hoy.
              </Text>
            </View>

            <View style={styles.heroRatingCard}>
              <View style={styles.heroRatingTop}>
                <Ionicons
                  name="star"
                  size={25}
                  color="#F5751A"
                />

                <Text style={styles.heroRatingValue}>
                  {restaurant.rating.toFixed(1)}
                </Text>
              </View>

              <Text style={styles.heroRatingLabel}>
                {restaurant.rating > 0 ? "Excelente" : "Sin reseñas"}
              </Text>
            </View>
          </View>

          {/* RECORDATORIO DEL MENÚ DE HOY */}
          {menuPublished === false && showMenuReminder && (
            <Animated.View
              style={[
                styles.menuReminderCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.menuReminderGlow} />

              <View style={styles.menuReminderContent}>
                <View style={styles.menuReminderCopy}>
                  <View style={styles.menuReminderBadge}>
                    <Ionicons
                      name="restaurant-outline"
                      size={14}
                      color="#F5751A"
                    />
                    <Text style={styles.menuReminderBadgeText}>
                      MENÚ DE HOY
                    </Text>
                  </View>

                  <Text style={styles.menuReminderTitle}>
                    ¿Ya preparaste el menú de hoy?
                  </Text>

                  <Text style={styles.menuReminderDescription}>
                    Tus clientes están esperando ver qué hay rico hoy.
                  </Text>

                  <View style={styles.menuReminderActions}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowMenuReminder(false)}
                      style={styles.remindLaterButton}
                    >
                      <Text style={styles.remindLaterText}>
                        Recordar luego
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => router.push("/(restaurant)/menu" as any)}
                      style={styles.uploadMenuButton}
                    >
                      <LinearGradient
                        colors={["#FF9D42", "#F5751A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.uploadMenuButtonGradient}
                      >
                        <Text style={styles.uploadMenuButtonText}>
                          Subir ahora
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={15}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                <Image
                  source={menuReminderCharacter}
                  resizeMode="contain"
                  style={styles.menuReminderCharacter}
                />
              </View>
            </Animated.View>
          )}

          {/* STATS 2x2 */}
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.statCard,
                  {
                    borderTopColor: stat.gradient[0],
                    opacity: cardAnims[i].opacity,
                    transform: [
                      {
                        translateY: cardAnims[i].translateY,
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    styles.statGlow,
                    { backgroundColor: stat.gradient[0] },
                  ]}
                />

                <View style={styles.statTopRow}>
                  <LinearGradient
                    colors={stat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statIconBadge}
                  >
                    <Ionicons
                      name={stat.icon as any}
                      size={19}
                      color="#FFFFFF"
                    />
                  </LinearGradient>

                  <View style={styles.statMiniLabel}>
                    <View
                      style={[
                        styles.statMiniDot,
                        { backgroundColor: stat.gradient[1] },
                      ]}
                    />
                    <Text style={styles.statMiniLabelText}>ACTUAL</Text>
                  </View>
                </View>

                <Text style={styles.statValue}>{stat.value}</Text>

                <Text style={styles.statLabel}>{stat.label}</Text>

                <View
                  style={[
                    styles.statAccentLine,
                    { backgroundColor: stat.gradient[1] },
                  ]}
                />
              </Animated.View>
            ))}
          </View>

          {/* ESTADÍSTICAS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Estadísticas</Text>

            <View style={styles.sectionTag}>
              <Text style={styles.sectionTagText}>
                Resumen actual
              </Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.chartCard,
              {
                opacity: chartAnim.opacity,
                transform: [
                  {
                    translateY: chartAnim.translateY,
                  },
                ],
              },
            ]}
          >
            <View style={styles.divider} />

            {breakdown.map((item, i) => (
              <BreakdownRow
                key={i}
                item={item}
                delay={i * 90}
              />
            ))}
          </Animated.View>

          {/* ACCESOS RÁPIDOS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Accesos rápidos
            </Text>
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

      <RestaurantBottomNav />
    </ImageBackground>
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
    Animated.spring(pressScale, {
      toValue: 0.97,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }

  function onPressOut() {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }

  return (
  <Animated.View
    style={{
      opacity,
      transform: [
        { translateY },
        { scale: pressScale },
      ],
    }}
  >
    <TouchableOpacity
      onPress={() => router.push(item.route as any)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.95}
    >
      <ImageBackground
        source={item.image}
        style={styles.quickCard}
        imageStyle={styles.quickBackgroundImage}
        resizeMode="cover"
      >
        {/* Degradado para que el texto siempre se lea */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.98)",
            "rgba(255,255,255,0.88)",
            "rgba(255,255,255,0.20)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.quickBackgroundImageStyle}
        />

        <View style={styles.quickCardContent}>
          {/* Icono */}
          <View style={styles.quickIconBadge}>
            <Ionicons
              name={item.icon as any}
              size={22}
              color="#F5751A"
            />
          </View>

          {/* Textos */}
          <View style={styles.quickTextContainer}>
            <Text style={styles.quickLabel}>
              {item.label}
            </Text>

            <Text style={styles.quickSub}>
              {item.sub}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  </Animated.View>
);
}
function BreakdownRow({
  item,
  delay,
}: {
  item: BreakdownItem;
  delay: number;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  const targetWidth =
    item.max > 0
      ? Math.min(100, (item.value / item.max) * 100)
      : 0;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: targetWidth,
      duration: 700,
      delay: 300 + delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [targetWidth, delay]);

  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLabelRow}>
        <Text style={styles.breakdownLabel}>
          {item.label}
        </Text>

        <Text style={styles.breakdownValue}>
          {item.display}
        </Text>
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

const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: "transparent",
},
  dashboardBackground: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },

  dashboardBackgroundImage: {
    width: "100%",
    height: "100%",
  },


dashboardScrollContent: {
  paddingBottom: 110,
},
  // ============================================================
  // MENÚ DESPLEGABLE — SOLO DASHBOARD
  // ============================================================

  dashboardMenuWrapper: {
    position: "absolute",
    top: 16,
    right: 18,
    zIndex: 50,
    alignItems: "flex-end",
  },

  dashboardMenuButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  dashboardDropdown: {
    width: 174,
    marginTop: 7,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  dashboardDropdownItem: {
    minHeight: 42,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  dashboardDropdownText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#2A2A2A",
  },

  // ============================================================
  // HERO / HEADER NUEVO
  // ============================================================

  heroIntro: {
  minHeight: 158,
  marginBottom: 18,
  paddingHorizontal: 8,
  position: "relative",
  justifyContent: "center",
},

heroIntroText: {
  paddingRight: 118,
},

heroGreeting: {
  fontSize: 16,
  fontWeight: "600",
  color: "#5C5C5C",
  marginBottom: 2,
},

heroRestaurantName: {
  fontSize: 34,
  fontWeight: "900",
  color: "#1A1A1A",
  letterSpacing: -1,
},

heroDescription: {
  fontSize: 15,
  lineHeight: 21,
  fontWeight: "500",
  color: "#777777",
  marginTop: 10,
},

heroRatingCard: {
  position: "absolute",
  right: 4,
  top: 36,
  minWidth: 92,
  backgroundColor: "rgba(255,255,255,0.92)",
  borderRadius: 18,
  paddingHorizontal: 14,
  paddingVertical: 12,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
},

heroRatingTop: {
  flexDirection: "row",
  alignItems: "center",
  gap: 7,
},

heroRatingValue: {
  fontSize: 25,
  fontWeight: "900",
  color: "#1A1A1A",
},

heroRatingLabel: {
  fontSize: 11,
  fontWeight: "700",
  color: "#999999",
  marginTop: 2,
},

  /* ------- Contenido ------- */
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },


  menuReminderCard: {
    minHeight: 190,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(245,168,0,0.18)",
    shadowColor: "#8A4A00",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  menuReminderGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -48,
    bottom: -58,
    backgroundColor: "rgba(255,169,77,0.16)",
  },
  menuReminderContent: {
    flex: 1,
    minHeight: 190,
    flexDirection: "row",
    paddingLeft: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  menuReminderCopy: {
    flex: 1,
    paddingRight: 6,
    zIndex: 2,
  },
  menuReminderBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#FFF4E3",
    marginBottom: 9,
  },
  menuReminderBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#C36D00",
    letterSpacing: 0.7,
  },
  menuReminderTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.3,
    maxWidth: 215,
  },
  menuReminderDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "500",
    color: "#8A8A8A",
    marginTop: 6,
    maxWidth: 215,
  },
  menuReminderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 13,
  },
  remindLaterButton: {
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  remindLaterText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#777777",
  },
  uploadMenuButton: {
    height: 36,
    borderRadius: 11,
    overflow: "hidden",
    shadowColor: "#F5751A",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  uploadMenuButtonGradient: {
    height: "100%",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  uploadMenuButtonText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  menuReminderCharacter: {
    position: "absolute",
    right: -8,
    bottom: -4,
    width: 138,
    height: 178,
    zIndex: 1,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 26,
  },
  statCard: {
    width: (width - 44) / 2,
    minHeight: 142,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderTopWidth: 2,
    padding: 16,
    paddingTop: 15,
    paddingLeft: 15,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#8A4A00",
    shadowOpacity: 0.10,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  statGlow: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    right: -34,
    top: -34,
    opacity: 0.10,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statMiniLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  statMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statMiniLabelText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#A0A0A0",
    letterSpacing: 0.8,
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
    color: "#777777",
    marginTop: 2,
    fontWeight: "600",
  },
  statAccentLine: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 11,
    height: 2,
    borderRadius: 2,
    opacity: 0.28,
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
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,168,0,0.10)",
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
  minHeight: 118,
  borderRadius: 18,
  overflow: "hidden",
  position: "relative",

  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
},

quickBackgroundImage: {
  borderRadius: 18,
},

quickBackgroundImageStyle: {
  ...StyleSheet.absoluteFillObject,
},

quickCardContent: {
  flex: 1,
  minHeight: 118,
  padding: 16,
  paddingLeft: 15,
  justifyContent: "center",
},

quickTextContainer: {
  marginTop: 2,
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