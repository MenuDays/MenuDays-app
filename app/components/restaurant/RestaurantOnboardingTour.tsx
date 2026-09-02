import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const bienvenidaImg = require("../../../assets/onboarding/tutoBienvenida.png");
const menusImg = require("../../../assets/onboarding/tutosMenus.png");
const platosImg = require("../../../assets/onboarding/tutoPlatos.png");
const promoImg = require("../../../assets/onboarding/tutoPromo.png");
const galeriaImg = require("../../../assets/onboarding/tutosGaleria.png");
const dashboardImg = require("../../../assets/onboarding/tutosDahdboard.png");
const finalImg = require("../../../assets/onboarding/tutoFinal.png");

const SLIDE_BG = "#F4230F";
const AMBER = "#FFC46B";

export type TourTargetKey = "menus" | "platos" | "promociones" | "galeria" | "estadisticas";

export interface TourRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourStep {
  key: string;
  kind: "slide" | "spotlight";
  image: any;
  title?: string;
  text?: string;
  targetKey?: TourTargetKey;
}

const TOUR_STEPS: TourStep[] = [
  { key: "bienvenida", kind: "slide", image: bienvenidaImg },
  {
    key: "menus",
    kind: "spotlight",
    image: menusImg,
    title: "Menús",
    text: "¡Empecemos por lo más importante! Publica tus menús desde Menús.",
    targetKey: "menus",
  },
  {
    key: "platos",
    kind: "spotlight",
    image: platosImg,
    title: "Platos",
    text: "Agrega tus platos. Muestra lo que preparas y haz que se les antoje.",
    targetKey: "platos",
  },
  {
    key: "promociones",
    kind: "spotlight",
    image: promoImg,
    title: "Promociones",
    text: "Crea promociones. Aprovecha ofertas y combos para atraer más clientes.",
    targetKey: "promociones",
  },
  {
    key: "galeria",
    kind: "spotlight",
    image: galeriaImg,
    title: "Galería",
    text: "Muestra tu restaurante. Sube fotos y deja que tus platos hablen por ti.",
    targetKey: "galeria",
  },
  {
    key: "estadisticas",
    kind: "spotlight",
    image: dashboardImg,
    title: "Estadísticas",
    text: "Mira cómo va tu restaurante. Consulta tus estadísticas y conoce cómo está creciendo.",
    targetKey: "estadisticas",
  },
  { key: "final", kind: "slide", image: finalImg },
];

const LAST_INDEX = TOUR_STEPS.length - 1;

interface Props {
  visible: boolean;
  onFinish: () => void;
  measureTarget: (key: TourTargetKey) => Promise<TourRect | null>;
}

export default function RestaurantOnboardingTour({ visible, onFinish, measureTarget }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<TourRect | null>(null);
  const contentAnim = useRef(new Animated.Value(0)).current;
  const rootAnim = useRef(new Animated.Value(0)).current;
  // Anima el "aterrizaje" del recuadro sobre la card objetivo.
  const ringAnim = useRef(new Animated.Value(0)).current;
  const requestId = useRef(0);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
      rootAnim.setValue(0);
      Animated.timing(rootAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const step = TOUR_STEPS[stepIndex];
    const myRequest = ++requestId.current;

    contentAnim.setValue(0);
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (step.kind === "spotlight" && step.targetKey) {
      setRect(null);
      ringAnim.setValue(0);
      measureTarget(step.targetKey).then((measured) => {
        if (requestId.current !== myRequest) return;
        setRect(measured);
        if (measured) {
          ringAnim.setValue(0);
          Animated.spring(ringAnim, {
            toValue: 1,
            friction: 7,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      });
    } else {
      setRect(null);
    }
  }, [visible, stepIndex]);

  // Botón "atrás" de Android: retrocede de paso en vez de cerrar la app /
  // salir del dashboard. En el primer paso, lo consume sin hacer nada.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setStepIndex((i) => Math.max(0, i - 1));
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  if (!visible) return null;

  const step = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === LAST_INDEX;

  function goNext() {
    if (isLast) {
      onFinish();
      return;
    }
    setStepIndex((i) => Math.min(LAST_INDEX, i + 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  const panelAtTop = rect ? rect.y + rect.height / 2 > windowHeight / 2 : true;

  const mascotHeight = Math.min(windowWidth * 0.34 * 1.5, windowHeight * 0.22, 210);
  const mascotWidth = mascotHeight / 1.5;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.overlayRoot, { opacity: rootAnim }]}
      // Bloquea todo el toque de la pantalla de atrás mientras el tour
      // está abierto (antes lo hacía el <Modal>).
      pointerEvents="auto"
    >
      {step.kind === "slide" ? (
        <View style={[styles.slideContainer, { backgroundColor: SLIDE_BG }]}>
          {/* cover: la ilustración llena TODO el marco en cualquier
              dispositivo (antes con "contain" quedaban franjas rojas a
              los costados en pantallas angostas). El fondo rojo de marca
              cubre cualquier borde. */}
          <Image source={step.image} resizeMode="cover" style={styles.slideImage} />

          {/* Difuminado de la foto hacia el rojo abajo -- así los puntos y
              el botón siempre se leen sobre color sólido, sin importar qué
              parte de la imagen quede detrás en cada pantalla. */}
          <LinearGradient
            colors={["transparent", "rgba(244,35,15,0.65)", SLIDE_BG]}
            locations={[0, 0.55, 1]}
            style={[styles.slideScrim, { height: windowHeight * 0.34 }]}
            pointerEvents="none"
          />

          <View style={[styles.slideControlBar, { paddingBottom: insets.bottom + 20 }]}>
            <Dots total={TOUR_STEPS.length} activeIndex={stepIndex} light />
            <TouchableOpacity activeOpacity={0.88} onPress={goNext} style={styles.primaryButton}>
              <View style={styles.primaryButtonWhite}>
                <Text style={styles.primaryButtonWhiteText}>{isFirst ? "Comenzar" : "Finalizar"}</Text>
                <Ionicons name="arrow-forward" size={16} color={SLIDE_BG} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {rect ? (
            <SpotlightHole
              rect={rect}
              ringAnim={ringAnim}
              windowWidth={windowWidth}
              windowHeight={windowHeight}
            />
          ) : (
            <View style={StyleSheet.absoluteFill} pointerEvents="auto">
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.fullTint} />
            </View>
          )}

          <Animated.View
            style={[
              styles.captionPanel,
              panelAtTop ? { top: insets.top + 14 } : { bottom: insets.bottom + 14 },
              {
                opacity: contentAnim,
                transform: [
                  {
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [panelAtTop ? -14 : 14, 0],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.mascotWrap}>
              <Image
                source={step.image}
                resizeMode="contain"
                style={{ width: mascotWidth, height: mascotHeight }}
              />
            </View>

            <View style={styles.textCard}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>

            <Dots total={TOUR_STEPS.length} activeIndex={stepIndex} />

            <View style={styles.navRow}>
              {!isFirst && (
                <TouchableOpacity activeOpacity={0.85} onPress={goBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>Atrás</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity activeOpacity={0.88} onPress={goNext} style={styles.nextButtonWrap}>
                <LinearGradient
                  colors={["#FFB74D", "#FB8C00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>{isLast ? "Finalizar" : "Siguiente"}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
}

function SpotlightHole({
  rect,
  ringAnim,
  windowWidth,
  windowHeight,
}: {
  rect: TourRect;
  ringAnim: Animated.Value;
  windowWidth: number;
  windowHeight: number;
}) {
  // El recuadro calca EXACTAMENTE la card: misma posición (x, y) y
  // mismas dimensiones (ancho, alto). `rect` ya viene en el sistema de
  // coordenadas del overlay (relativo al mismo contenedor), así que no
  // hay corrección de status bar ni desfase.
  const pad = 0;
  const radius = 20; // = CARD_RADIUS del dashboard
  const hx = Math.max(0, rect.x - pad);
  const hy = Math.max(0, rect.y - pad);
  const hw = Math.min(windowWidth - hx, rect.width + pad * 2);
  const hh = Math.min(windowHeight - hy, rect.height + pad * 2);

  // El recuadro "aterriza": arranca un poco más grande y se ajusta.
  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      {/* 4 bandas difuminadas que dejan un hueco NÍTIDO exactamente sobre
          la card. Cubren toda la pantalla menos ese hueco. */}
      <BlurBand style={{ top: 0, left: 0, right: 0, height: Math.max(0, hy) }} />
      <BlurBand style={{ top: hy + hh, left: 0, right: 0, bottom: 0 }} />
      <BlurBand style={{ top: hy, height: hh, left: 0, width: Math.max(0, hx) }} />
      <BlurBand style={{ top: hy, height: hh, left: hx + hw, right: 0 }} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            top: hy,
            left: hx,
            width: hw,
            height: hh,
            borderRadius: radius,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {/* halo suave alrededor del recuadro */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ringHalo,
          {
            top: hy - 5,
            left: hx - 5,
            width: hw + 10,
            height: hh + 10,
            borderRadius: radius + 5,
            opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }),
            transform: [{ scale: ringScale }],
          },
        ]}
      />
    </View>
  );
}

function BlurBand({ style }: { style: any }) {
  return (
    <View style={[styles.bandContainer, style]}>
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.bandTint} />
    </View>
  );
}

function Dots({ total, activeIndex, light }: { total: number; activeIndex: number; light?: boolean }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            light && styles.dotLight,
            i === activeIndex && (light ? styles.dotActiveLight : styles.dotActive),
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    // Por encima de la bottom nav (elevation 10) y el FAB.
    zIndex: 9999,
    elevation: 9999,
  },
  slideContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  slideScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  slideControlBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  primaryButton: {
    marginTop: 14,
    width: "100%",
    maxWidth: 340,
  },
  primaryButtonWhite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
  },
  primaryButtonWhiteText: {
    color: SLIDE_BG,
    fontSize: 16,
    fontWeight: "800",
  },
  fullTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,5,4,0.6)",
  },
  bandContainer: {
    position: "absolute",
    overflow: "hidden",
  },
  bandTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,5,4,0.62)",
  },
  ring: {
    position: "absolute",
    borderWidth: 3,
    borderColor: AMBER,
    backgroundColor: "transparent",
  },
  ringHalo: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,196,107,0.35)",
    backgroundColor: "transparent",
  },
  captionPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  mascotWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  textCard: {
    marginTop: 4,
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1207",
  },
  stepText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4A4137",
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotLight: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    width: 18,
    backgroundColor: AMBER,
  },
  dotActiveLight: {
    width: 18,
    backgroundColor: "#FFFFFF",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 14,
    width: "100%",
    maxWidth: 380,
  },
  backButton: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  nextButtonWrap: {
    flex: 1,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 24,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
