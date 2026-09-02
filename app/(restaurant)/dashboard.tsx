import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import {
  useSafeAreaInsets
} from "react-native-safe-area-context";
import RestaurantService from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import QuickActionsFab from "../components/restaurant/QuickActionsFab";
import RestaurantOnboardingTour, { TourRect, TourTargetKey } from "../components/restaurant/RestaurantOnboardingTour";
import { PENDING_RESTAURANT_ONBOARDING_KEY } from "../../constants/onboardingKeys";
// El dashboard del restaurante queda fijo en look oscuro (ver comentario
// más abajo) -> usa el mismo patrón "fondo_oscuro" que el resto de la app.
const heroBg = require("../../assets/images/app-bg-dark.jpg");
const menuReminderCharacter = require("../../assets/characters/niñoPensando.png");

// ============================================================
// DATA — mockeada, pero con el shape que ya esperarías del
// backend (GET /restaurants/:id/dashboard o similar). El día que
// conectes el fetch real, reemplazás estas constantes por el
// resultado de la llamada; el JSX no debería necesitar cambios.
// ============================================================

// ============================================================
// Paleta "premium" oscura -- SOLO visual, no toca lógica/datos.
// El dashboard queda fijo en este look (no sigue el toggle de
// tema claro/oscuro de la app) porque ahora vive sobre la foto de
// fondoRestaurante: un dashboard mitad claro/mitad oscuro según el
// tema del usuario se vería inconsistente contra esa imagen fija.
// ============================================================
const INK = "#0B0906";
const GLASS_BG = "rgba(255,255,255,0.055)";
const GLASS_BG_STRONG = "rgba(255,255,255,0.09)";
const GLASS_BORDER = "rgba(255,255,255,0.12)";
const GLASS_BORDER_SOFT = "rgba(255,255,255,0.08)";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "rgba(255,255,255,0.62)";
const TEXT_TERTIARY = "rgba(255,255,255,0.42)";
const AMBER = "#FFC46B";

// Escala de radios unificada -- antes cada card usaba un valor distinto
// (22/20/24/18...) elegido "a ojo", lo que se termina notando como
// inconsistencia visual. Una sola escala (cards grandes / chips chicos)
// da un lenguaje de diseño coherente en todo el dashboard.
const CARD_RADIUS = 20;
const CHIP_RADIUS = 12;

// Las grillas (stats y accesos rápidos) son SIEMPRE 2x2 -- en teléfono,
// tablet o desktop -- para que el layout sea idéntico y predecible en
// cualquier dispositivo. Lo único que cambia en pantallas grandes es que
// el contenido se centra con un ancho máximo (contentWide más abajo),
// para que las cards no se estiren de punta a punta ni queden gigantes.
const WIDE_BREAKPOINT = 560;
const WIDE_CONTENT_MAX_WIDTH = 480;
const GRID_ITEM_WIDTH: `${number}%` = "48%";

interface BreakdownItem {
  label: string;
  value: number;
  max: number;
  display: string;
  gradient: [string, string];
  icon: string;
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
    icon: "star",
  },
  {
    label: "Promociones activas",
    value: 0,
    max: 5,
    display: "0",
    gradient: ["#42C8FF", "#1AA3F5"],
    icon: "pricetag",
  },
  {
    label: "Platos registrados",
    value: 0,
    max: 20,
    display: "0",
    gradient: ["#7ED957", "#2FB966"],
    icon: "restaurant",
  },
];
const QUICK_ACCESS: QuickAccessItem[] = [
  {
    icon: "fast-food-outline",
    label: "Platos",
    sub: "Gestionar platos",
    route: "/(restaurant)/platos",
    gradient: ["#FF9D42", "#F5751A"],
  },
  {
    icon: "pricetag-outline",
    label: "Promociones",
    sub: "Crear y administrar",
    route: "/(restaurant)/promociones",
    gradient: ["#FFC94D", "#F5A800"],
  },
  {
    icon: "restaurant-outline",
    label: "Menús del día",
    sub: "Crear menús",
    route: "/(restaurant)/menu",
    gradient: ["#FF9D42", "#F5751A"],
  },
  {
    icon: "images-outline",
    label: "Galería",
    sub: "Fotos del local",
    route: "/(restaurant)/gallery",
    gradient: ["#FFB74D", "#F5871A"],
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

// Flag "tutorial pendiente" -- ver constants/onboardingKeys.ts.

export default function RestaurantDashboard() {
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();
  // Las grillas de stats y accesos rápidos son siempre 2x2 (ver
  // GRID_ITEM_WIDTH) -- lo único responsive es centrar el contenido con
  // un ancho máximo en pantallas grandes, para que no se estire.
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWide = windowWidth >= WIDE_BREAKPOINT;

  // Arranca en null ("todavía no sabemos") para no mostrar ni el estado
  // publicado ni el de "falta publicar" hasta tener la respuesta real.
  const [menuPublished, setMenuPublished] = React.useState<boolean | null>(null);
  const [showMenuReminder, setShowMenuReminder] = React.useState(true);
  const [restaurant, setRestaurant] = React.useState({
  id: "",
  name: "",
  rating: 0,
  cantidadResenas: 0,
});

  // El FAB de accesos rápidos guarda su estado "abierto/cerrado" adentro
  // (QuickActionsFab). Si el usuario lo abre y navega por otro lado sin
  // pasar por una de sus 4 acciones (ej. toca un tab del bottom nav), el
  // dashboard puede quedar montado en la pila con el FAB todavía
  // "abierto" en memoria. Cambiar esta key al reenfocar la pantalla
  // fuerza un remount limpio -- vuelve a nacer cerrado, sin lógica extra.
  const [fabKey, setFabKey] = React.useState(0);
  useFocusEffect(
    useCallback(() => {
      setFabKey((k) => k + 1);

      // Tutorial pendiente: lo deja login.tsx (cada inicio de sesión) o el
      // botón "Repetir tutorial" de Mi perfil. Se chequea al enfocar --
      // no solo al montar -- para que al volver de ese botón se dispare
      // aunque el dashboard ya estuviera en la pila.
      AsyncStorage.getItem(PENDING_RESTAURANT_ONBOARDING_KEY)
        .then((pending) => {
          if (pending) {
            setOnboardingVisible(true);
            AsyncStorage.removeItem(PENDING_RESTAURANT_ONBOARDING_KEY).catch(() => {});
          }
        })
        .catch(() => {});
    }, [])
  );


  // Platos registrados, promociones activas, pedidos pendientes, reseñas
  // y el estado del menú de hoy vienen todos juntos de un único llamado
  // a GET /restaurants/dashboard (RestaurantService.getDashboard()) --
  // antes esto eran 3 llamadas separadas (platos/promociones/perfil) +
  // "Pedidos pendientes" hardcodeado en 0 para siempre, porque ese dato
  // no se pedía. Se arranca con el shape mockeado (para que el layout y
  // las animaciones no salten) y se pisa al llegar la respuesta real.
  const [stats, setStats] = React.useState<StatItem[]>(STATS);
  const [breakdown, setBreakdown] = React.useState<BreakdownItem[]>(BREAKDOWN);
  const [refreshing, setRefreshing] = React.useState(false);

  // Onboarding interactivo (7 pasos) para restaurantes que abren su
  // dashboard por primera vez. Se muestra solo si no hay flag guardado
  // en AsyncStorage para ESTE restaurante (restaurante.id).
  const [onboardingVisible, setOnboardingVisible] = React.useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  // Contenedor que envuelve TODO el dashboard y también al overlay del
  // tutorial. Las cards se miden RELATIVO a este nodo (no a la ventana),
  // así el recuadro del tutorial cae exactamente sobre la card sin
  // desfase por la status bar / edge-to-edge.
  const overlayHostRef = useRef<View>(null);
  const menuCardRef = useRef<View>(null);
  const platosCardRef = useRef<View>(null);
  const promocionesCardRef = useRef<View>(null);
  const galeriaCardRef = useRef<View>(null);
  const statsCardRef = useRef<View>(null);

  function handleDashboardScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  }

  function getTourTargetRef(key: TourTargetKey) {
    if (key === "menus") return menuCardRef;
    if (key === "platos") return platosCardRef;
    if (key === "promociones") return promocionesCardRef;
    if (key === "galeria") return galeriaCardRef;
    return statsCardRef;
  }

  function getQuickAccessCardRef(route: string) {
    if (route === "/(restaurant)/menu") return menuCardRef;
    if (route === "/(restaurant)/platos") return platosCardRef;
    if (route === "/(restaurant)/promociones") return promocionesCardRef;
    if (route === "/(restaurant)/gallery") return galeriaCardRef;
    return undefined;
  }

  // Mide la posición real (en pantalla) del elemento objetivo. Si no
  // está suficientemente visible, hace scroll programático del dashboard
  // para acercarlo -- y después ESPERA a que la medición se estabilice
  // (dos lecturas seguidas iguales) en vez de medir a ciegas tras un
  // delay fijo. Antes ese delay fijo (420ms) a veces caía en mitad del
  // scroll animado, y el recuadro del tutorial quedaba desfasado del
  // componente real. Así el spotlight cae exacto sobre la UI real, sin
  // importar el tamaño de pantalla ni cuánto haya que desplazarse.
  function measureNodeInWindow(node: View | null): Promise<TourRect | null> {
    return new Promise((resolve) => {
      if (!node) {
        resolve(null);
        return;
      }
      node.measureInWindow((x, y, width, height) => {
        if (x == null || y == null) resolve(null);
        else resolve({ x, y, width, height });
      });
    });
  }

  async function measureTourTargetOnce(
    key: TourTargetKey
  ): Promise<TourRect | null> {
    const ref = getTourTargetRef(key);
    const [card, host] = await Promise.all([
      measureNodeInWindow(ref.current),
      measureNodeInWindow(overlayHostRef.current),
    ]);
    if (!card || !host || (!card.width && !card.height)) return null;
    // Coordenadas de la card RELATIVAS al contenedor del overlay -> el
    // recuadro del tutorial usa estos mismos números tal cual.
    return {
      x: card.x - host.x,
      y: card.y - host.y,
      width: card.width,
      height: card.height,
    };
  }

  async function settleTourTarget(key: TourTargetKey): Promise<TourRect | null> {
    let prev = await measureTourTargetOnce(key);
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 80));
      const next = await measureTourTargetOnce(key);
      if (!next) return prev;
      if (
        prev &&
        Math.abs(next.y - prev.y) < 1 &&
        Math.abs(next.x - prev.x) < 1 &&
        Math.abs(next.height - prev.height) < 1
      ) {
        return next;
      }
      prev = next;
    }
    return prev;
  }

  async function measureTourTarget(key: TourTargetKey): Promise<TourRect | null> {
    const first = await measureTourTargetOnce(key);
    if (!first) return null;

    // Margen generoso para que la card no quede pegada al borde de la
    // pantalla ni debajo del panel de texto del tutorial.
    const topBound = insets.top + 96;
    const bottomBound = windowHeight - insets.bottom - 96;
    let delta = 0;
    if (first.y < topBound) {
      delta = first.y - (insets.top + 128);
    } else if (first.y + first.height > bottomBound) {
      delta = first.y + first.height - (windowHeight - insets.bottom - 128);
    }

    if (Math.abs(delta) > 8 && scrollRef.current) {
      const nextY = Math.max(0, scrollYRef.current + delta);
      scrollRef.current.scrollTo({ y: nextY, animated: true });
    }

    return settleTourTarget(key);
  }

  function handleOnboardingFinish() {
    setOnboardingVisible(false);
  }

  // Recarga al enfocar (además del montaje inicial): así el contador de
  // "Pedidos pendientes" -- y el resto de las stats -- refleja lo que pasó
  // mientras el restaurante estaba en otra pantalla (ej. acaba de aceptar
  // pedidos en Mi Local y vuelve al dashboard).
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadDashboard();
  }

  async function loadDashboard() {
      try {
        const data = await RestaurantService.getDashboard();
        const { resumen } = data;

        setRestaurant({
          id: String(data.restaurante.id),
          name: data.restaurante.nombreComercial ?? "",
          rating: resumen.calificacionPromedio,
          cantidadResenas: resumen.cantidadResenas,
        });

        // El chequeo del tutorial pendiente vive en el useFocusEffect de
        // arriba (se dispara al enfocar, no solo al cargar datos).

        setMenuPublished(resumen.menuPublicadoHoy);

        setStats((prev) =>
          prev.map((stat) => {
            if (stat.label === "Platos registrados") {
              return { ...stat, value: String(resumen.platosRegistrados) };
            }
            if (stat.label === "Promociones activas") {
              return { ...stat, value: String(resumen.promocionesActivas) };
            }
            if (stat.label === "Pedidos pendientes") {
              return { ...stat, value: String(resumen.pedidosPendientes) };
            }
            if (stat.label === "Reseñas") {
              return { ...stat, value: resumen.calificacionPromedio.toFixed(1) };
            }
            return stat;
          })
        );

        setBreakdown((prev) =>
          prev.map((item) => {
            if (item.label === "Reseñas") {
              return {
                ...item,
                value: resumen.calificacionPromedio,
                display: resumen.calificacionPromedio.toFixed(1),
              };
            }
            if (item.label === "Promociones activas") {
              return {
                ...item,
                value: resumen.promocionesActivas,
                display: String(resumen.promocionesActivas),
              };
            }
            if (item.label === "Platos registrados") {
              return {
                ...item,
                value: resumen.platosRegistrados,
                display: String(resumen.platosRegistrados),
              };
            }
            return item;
          })
        );
      } catch (e: any) {
        AppAlert.alert("Error", e.message || "No se pudieron cargar las estadísticas.");
        setMenuPublished(false);
      } finally {
        setRefreshing(false);
      }
  }

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

  // Cada card de estadística es un acceso directo a su pantalla real
  // existente (no se crean pantallas nuevas):
  //  - Platos registrados  -> listado de Platos
  //  - Promociones activas -> listado de Promociones
  //  - Pedidos pendientes  -> Mi Local, ya filtrado en "pendiente"
  //  - Reseñas             -> reseñas de ESTE restaurante (mismo endpoint
  //                           /restaurants/:id/reviews que usa el comensal)
  function handleStatPress(label: string) {
    switch (label) {
      case "Platos registrados":
        router.push("/(restaurant)/platos" as any);
        break;
      case "Promociones activas":
        router.push("/(restaurant)/promociones" as any);
        break;
      case "Pedidos pendientes":
        router.push("/(restaurant)/mi-local?estado=pendiente" as any);
        break;
      case "Reseñas":
        if (!restaurant.id) return;
        // Misma pantalla y mismo endpoint (/restaurants/:id/reviews) que usa
        // el comensal -- se le pasa el id de ESTE restaurante, así muestra
        // sus propias reseñas.
        router.push({
          pathname: "/restaurant-reviews",
          params: {
            id: restaurant.id,
            nombre: restaurant.name,
            promedio: String(restaurant.rating),
            cantidad: String(restaurant.cantidadResenas),
          },
        } as any);
        break;
    }
  }

  return (
    <View ref={overlayHostRef} style={styles.host} collapsable={false}>
    <ImageBackground
      source={heroBg}
      resizeMode="cover"
      style={styles.dashboardBackground}
      imageStyle={styles.dashboardBackgroundImage}
    >
      {/* Scrim oscuro sobre la foto -- da el look "premium oscuro" pedido
          y garantiza contraste fuerte para el texto blanco de encima,
          sin importar qué tan clara/colorida salga esa zona de la foto. */}
      <LinearGradient
        colors={["rgba(9,7,6,0.10)", "rgba(9,7,6,0.35)", "rgba(6,5,4,0.72)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Todo el dashboard vive sobre la imagen hero de fondo. */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!onboardingVisible}
        onScroll={handleDashboardScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.dashboardScrollContent,
          { paddingTop: insets.top + 22 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFB74D" />}
      >
        <Animated.View
          style={[
            styles.content,
            isWide && styles.contentWide,
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
                  color={AMBER}
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
              {/* Glow con degradado (no un círculo de color plano) --
                  se ve como una luz suave, no como un recorte sólido. */}
              <LinearGradient
                colors={["rgba(255,169,77,0.4)", "rgba(255,169,77,0)"]}
                start={{ x: 1, y: 1 }}
                end={{ x: 0.15, y: 0.15 }}
                style={styles.menuReminderGlow}
              />

              <View style={styles.menuReminderContent}>
                <View style={styles.menuReminderCopy}>
                  <View style={styles.menuReminderBadge}>
                    <Ionicons
                      name="restaurant-outline"
                      size={14}
                      color={AMBER}
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

          {/* STATS 2x2 (4x1 en tablet/desktop) -- protagonistas: números
              grandes, glow de color, chip "ACTUAL". Cada card es un
              BOTÓN: toda la superficie navega a su pantalla real, y el
              chevron de abajo indica que es tocable. */}
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
                <Pressable
                  onPress={() => handleStatPress(stat.label)}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                  style={({ pressed }) => [
                    styles.statCardInner,
                    pressed && styles.statCardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${stat.label}: ${stat.value}. Abrir`}
                >
                  {/* Glow con degradado (no un círculo de color plano) --
                      se ve como una luz suave, no como un recorte sólido. */}
                  <LinearGradient
                    colors={[`${stat.gradient[0]}66`, `${stat.gradient[0]}00`]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0.2, y: 0.8 }}
                    style={styles.statGlow}
                    pointerEvents="none"
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

                  <View style={styles.statLabelRow}>
                    <Text style={styles.statLabel} numberOfLines={1}>
                      {stat.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={stat.gradient[1]}
                      style={styles.statChevron}
                    />
                  </View>

                  <View
                    style={[
                      styles.statAccentLine,
                      { backgroundColor: stat.gradient[1] },
                    ]}
                  />
                </Pressable>
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
            <View style={styles.gaugeRow} ref={statsCardRef} collapsable={false}>
              {breakdown.map((item, i) => (
                <StatGaugeWidget key={i} item={item} delay={i * 90} />
              ))}
            </View>
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
                cardRef={getQuickAccessCardRef(item.route)}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <RestaurantBottomNav />

      <QuickActionsFab
        key={fabKey}
        actions={[
          {
            icon: "restaurant-outline",
            label: "Menú",
            // Mismo flujo actual de creación de menú (con Colecciones),
            // sin colección preseleccionada -- igual que el FAB de
            // menu.tsx cuando se crea "en general".
            onPress: () => router.push("/(restaurant)/menu/form" as any),
          },
          {
            icon: "pricetag-outline",
            label: "Promoción",
            onPress: () => router.push("/(restaurant)/promociones/form" as any),
          },
          {
            icon: "fast-food-outline",
            label: "Plato",
            onPress: () => router.push("/(restaurant)/platos/form" as any),
          },
          {
            icon: "images-outline",
            label: "Galería",
            // La galería no tiene una ruta de "agregar" separada: el
            // "+" para subir una foto vive en la propia pantalla
            // (ver ScreenHeader rightIcon="add" en gallery.tsx).
            onPress: () => router.push("/(restaurant)/gallery" as any),
          },
        ]}
      />

      <RestaurantOnboardingTour
        visible={onboardingVisible}
        onFinish={handleOnboardingFinish}
        measureTarget={measureTourTarget}
      />
    </ImageBackground>
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
  cardRef,
}: {
  item: QuickAccessItem;
  opacity: Animated.Value;
  translateY: Animated.Value;
  cardRef?: React.Ref<View>;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  // Solo tiene efecto real en la Device Preview web (mouse) -- en
  // touch, onHoverIn/onHoverOut de Pressable nunca disparan, así que
  // en la app nativa esto queda inerte sin ningún cambio de
  // comportamiento.
  const [hovered, setHovered] = useState(false);

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
    ref={cardRef}
    collapsable={false}
    style={[
      styles.quickCardWrap,
      {
        opacity,
        transform: [
          { translateY },
          { scale: pressScale },
        ],
      },
      hovered && styles.quickCardWrapHovered,
    ]}
  >
    <Pressable
      onPress={() => router.push(item.route as any)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={styles.quickCard}
    >
      {/* Reflejo sutil arriba -- típico de tarjetas "glass" en dashboards
          premium, refuerza la sensación de superficie con profundidad. */}
      <LinearGradient
        colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.quickTopHighlight}
        pointerEvents="none"
      />

      {/* Franja de color a la izquierda: refuerza que toda la card es
          un botón tocable. */}
      <View style={[styles.quickAccentBar, { backgroundColor: item.gradient[1] }]} />

      <View style={styles.quickCardContent}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickIconBadge}
        >
          <Ionicons
            name={item.icon as any}
            size={22}
            color="#FFFFFF"
          />
        </LinearGradient>

        <View style={styles.quickTextContainer}>
          <Text style={styles.quickLabel}>
            {item.label}
          </Text>

          <Text style={styles.quickSub}>
            {item.sub}
          </Text>
        </View>
      </View>

      {/* CTA en su propia franja abajo, ancho completo y centrada -- no
          un pill chico en una esquina -- para que se lea sin dudas como
          UN BOTÓN, distinto del resto de las cards informativas. */}
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.quickCta}
      >
        <Text style={styles.quickCtaText}>Abrir</Text>
        <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  </Animated.View>
);
}
// Widget circular en vez de la barra lineal de antes -- con maximos
// chicos (5, 20) una barra queda "llena" la mayoría del tiempo y no
// dice nada útil de un vistazo. Un anillo con el número grande en el
// centro se lee bien tenga el valor que tenga, y cada métrica usa su
// propio color bien distinto (antes las 3 eran variantes de naranja).
const GAUGE_SIZE = 78;
const GAUGE_STROKE = 7;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function StatGaugeWidget({
  item,
  delay,
}: {
  item: BreakdownItem;
  delay: number;
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const targetPct =
    item.max > 0
      ? Math.min(100, (item.value / item.max) * 100)
      : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: targetPct,
      duration: 900,
      delay: 300 + delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [targetPct, delay]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [GAUGE_CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.gaugeWidget}>
      <View style={styles.gaugeRingWrap}>
        <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
          <Circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={GAUGE_RADIUS}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={GAUGE_STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={GAUGE_RADIUS}
            stroke={item.gradient[1]}
            strokeWidth={GAUGE_STROKE}
            fill="none"
            strokeDasharray={`${GAUGE_CIRCUMFERENCE} ${GAUGE_CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Ionicons name={item.icon as any} size={13} color={item.gradient[1]} />
          <Text style={styles.gaugeValue}>{item.display}</Text>
        </View>
      </View>
      <Text style={styles.gaugeLabel} numberOfLines={2}>
        {item.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  container: {
  flex: 1,
  backgroundColor: "transparent",
},
  dashboardBackground: {
    flex: 1,
    width: "100%",
    backgroundColor: INK,
  },

  dashboardBackgroundImage: {
    width: "100%",
    height: "100%",
  },


dashboardScrollContent: {
  paddingBottom: 110,
},
  // ============================================================
  // HERO / HEADER NUEVO
  // ============================================================

  // Fila flex en vez de la posición absoluta de antes (heroRatingCard
  // flotando con right/top a mano): así los dos bloques siempre quedan
  // alineados y centrados verticalmente entre sí sin importar el largo
  // del nombre del restaurante ni el ancho de pantalla -- antes, un
  // nombre largo o una pantalla angosta podía hacer que el texto
  // chocara contra la card de calificación.
  heroIntro: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  marginBottom: 22,
  paddingHorizontal: 8,
},

heroIntroText: {
  flex: 1,
},

heroGreeting: {
  fontSize: 15,
  fontWeight: "600",
  color: TEXT_SECONDARY,
  marginBottom: 2,
},

heroRestaurantName: {
  fontSize: 28,
  fontWeight: "900",
  color: TEXT_PRIMARY,
  letterSpacing: -0.6,
  textShadowColor: "rgba(0,0,0,0.4)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 10,
},

heroDescription: {
  fontSize: 14,
  lineHeight: 19,
  fontWeight: "500",
  color: TEXT_SECONDARY,
  marginTop: 8,
},

heroRatingCard: {
  minWidth: 84,
  alignItems: "center",
  backgroundColor: GLASS_BG_STRONG,
  borderWidth: 1,
  borderColor: GLASS_BORDER,
  borderRadius: CARD_RADIUS,
  paddingHorizontal: 14,
  paddingVertical: 12,
  shadowColor: "#000",
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
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
  color: TEXT_PRIMARY,
},

heroRatingLabel: {
  fontSize: 11,
  fontWeight: "700",
  color: TEXT_SECONDARY,
  marginTop: 2,
},

  /* ------- Contenido ------- */
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },
  // Centrado y con ancho máximo en tablet/desktop -- evita que las
  // cards se estiren de punta a punta en pantallas grandes.
  contentWide: {
    maxWidth: WIDE_CONTENT_MAX_WIDTH,
    width: "100%",
    alignSelf: "center",
  },


  menuReminderCard: {
    minHeight: 190,
    marginBottom: 28,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    position: "relative",
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  menuReminderGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -48,
    bottom: -58,
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
    borderRadius: CHIP_RADIUS,
    backgroundColor: "rgba(255,152,0,0.16)",
    marginBottom: 9,
  },
  menuReminderBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: AMBER,
    letterSpacing: 0.7,
  },
  menuReminderTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
    maxWidth: 215,
  },
  menuReminderDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "500",
    color: TEXT_SECONDARY,
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
    borderRadius: CHIP_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: GLASS_BORDER_SOFT,
  },
  remindLaterText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: TEXT_SECONDARY,
  },
  uploadMenuButton: {
    height: 36,
    borderRadius: CHIP_RADIUS,
    overflow: "hidden",
    shadowColor: "#F5751A",
    shadowOpacity: 0.35,
    shadowRadius: 10,
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
    marginBottom: 28,
  },
  statCard: {
    // Siempre 2 columnas -- en teléfono, tablet o desktop -- para que
    // la grilla sea idéntica y predecible en cualquier dispositivo.
    width: GRID_ITEM_WIDTH,
    minHeight: 142,
    backgroundColor: GLASS_BG,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderTopWidth: 2,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  // El padding vive acá (el Pressable) -> TODA la card es táctil, no solo
  // la zona interna.
  statCardInner: {
    flex: 1,
    padding: 16,
    paddingTop: 15,
    paddingLeft: 15,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  statCardPressed: {
    opacity: 0.82,
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statChevron: {
    marginLeft: 6,
    opacity: 0.9,
  },
  statGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    right: -38,
    top: -38,
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
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  statMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statMiniLabelText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F5A800",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: TEXT_PRIMARY,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  statLabel: {
    flex: 1,
    fontSize: 12.5,
    color: TEXT_SECONDARY,
    fontWeight: "600",
  },
  statAccentLine: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 11,
    height: 2,
    borderRadius: 2,
    opacity: 0.4,
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
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: AMBER,
  },
  sectionTag: {
    backgroundColor: "rgba(255,183,64,0.14)",
    borderRadius: CHIP_RADIUS,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionTagText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: AMBER,
  },

  /* ------- Estadísticas ------- */
  chartCard: {
    backgroundColor: GLASS_BG,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    padding: 18,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  gaugeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gaugeWidget: {
    alignItems: "center",
    width: "31%",
  },
  gaugeRingWrap: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeCenter: {
    position: "absolute",
    alignItems: "center",
  },
  gaugeValue: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT_PRIMARY,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT_SECONDARY,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 14,
  },

quickGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
},
// Siempre 2 columnas, igual que statsGrid -- ver GRID_ITEM_WIDTH.
//
// La sombra vive en el wrap, no en quickCard: quickCard tiene
// overflow:hidden (para recortar el reflejo/franja con bordes
// redondeados) y en Android una sombra/elevation en el mismo nodo
// que overflow:hidden queda recortada junto con el contenido.
quickCardWrap: {
  width: GRID_ITEM_WIDTH,
  borderRadius: CARD_RADIUS,
  shadowColor: "#000",
  shadowOpacity: 0.4,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
},
// Solo tiene efecto visible en la Device Preview web (mouse hover) --
// en touch nunca se activa.
quickCardWrapHovered: {
  shadowOpacity: 0.55,
  shadowRadius: 24,
},
quickCard: {
  minHeight: 118,
  borderRadius: CARD_RADIUS,
  overflow: "hidden",
  position: "relative",
  backgroundColor: GLASS_BG,
  borderWidth: 1,
  borderColor: GLASS_BORDER,
},

quickTopHighlight: {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 40,
},

quickAccentBar: {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
},

quickCardContent: {
  padding: 16,
  paddingLeft: 15,
  paddingBottom: 14,
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
  shadowOpacity: 0.4,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
},
quickLabel: {
  fontSize: 14.5,
  fontWeight: "800",
  color: TEXT_PRIMARY,
  letterSpacing: -0.2,
},
quickSub: {
  fontSize: 11.5,
  color: TEXT_SECONDARY,
  fontWeight: "500",
},
// Franja de ancho completo, no un pill en una esquina -- grande y
// centrada para que se lea sin dudas como EL botón de la card.
quickCta: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  paddingVertical: 13,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: -1 },
},
quickCtaText: {
  fontSize: 13.5,
  fontWeight: "800",
  color: "#FFFFFF",
  letterSpacing: 0.2,
},
});
