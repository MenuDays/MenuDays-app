import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
// Proporcional al ancho de pantalla, con 300 como techo: en celulares
// angostos no ocupa casi toda la pantalla, y en tablets no queda chico.
const DRAWER_WIDTH = Math.min(300, SCREEN_WIDTH * 0.82);

// Zona invisible desde donde se puede iniciar el gesto.
// Es suficientemente amplia para que sea fácil abrirlo con el dedo,
// pero no tapa las flechas de "atrás" de las pantallas.
const EDGE_SWIPE_WIDTH = 42;
const SWIPE_OPEN_THRESHOLD = 70;
const SWIPE_CLOSE_THRESHOLD = 70;

export default function RestaurantLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const gestureStartX = useRef(0);
  const gestureStartY = useRef(0);
  const edgeGestureActive = useRef(false);

  // ============================================================
  // ABRIR / CERRAR
  // ============================================================

  const openMenu = () => {
    setMenuVisible(true);

    slideAnim.setValue(-DRAWER_WIDTH);
    backdropAnim.setValue(0);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;

      setMenuVisible(false);
      callback?.();
    });
  };

  const goTo = (route: string) => {
    closeMenu(() => {
      router.push(route as any);
    });
  };

  // ============================================================
  // GESTO PARA ABRIR DESDE EL BORDE IZQUIERDO
  //
  // IMPORTANTE:
  // Este responder vive en una zona invisible independiente
  // del Stack. Así los ScrollView / TouchableOpacity de las
  // pantallas no se comen el gesto.
  // ============================================================

  const edgePanResponder = useRef(
    PanResponder.create({
      // OJO: esta zona invisible (edgeSwipeZone) se dibuja ENCIMA de toda
      // la pantalla (zIndex 999), tapando también el botón "atrás" del
      // header de cada pantalla (que vive justo en ese primer
      // EDGE_SWIPE_WIDTH de la izquierda). Con onStartShouldSetPanResponder
      // devolviendo true apenas se toca esa zona (sin esperar movimiento),
      // CUALQUIER tap ahí -- incluido un tap plano sobre el botón atrás --
      // quedaba capturado acá y el TouchableOpacity de abajo nunca recibía
      // el press. Por eso no reclamamos nada en el "start": solo
      // onMoveShouldSetPanResponder (que ya exige un arrastre horizontal
      // real, gesture.dx > 5) puede quedarse con el gesto. Un tap simple
      // (sin arrastre) nunca lo reclama y pasa de largo al botón de atrás.
      onStartShouldSetPanResponder: () => false,

      onMoveShouldSetPanResponder: (_, gesture) => {
        if (menuVisible) return false;

        const horizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);

        return (
          gesture.x0 <= EDGE_SWIPE_WIDTH &&
          horizontal &&
          gesture.dx > 5
        );
      },

      onPanResponderGrant: (_, gesture) => {
        gestureStartX.current = gesture.x0;
        gestureStartY.current = gesture.y0;

        edgeGestureActive.current =
          !menuVisible && gesture.x0 <= EDGE_SWIPE_WIDTH;

        if (!edgeGestureActive.current) return;

        setMenuVisible(true);
        slideAnim.setValue(-DRAWER_WIDTH);
        backdropAnim.setValue(0);
      },

      onPanResponderMove: (_, gesture) => {
        if (!edgeGestureActive.current) return;

        const dx = Math.max(0, gesture.dx);

        const translateX = Math.min(
          0,
          -DRAWER_WIDTH + dx
        );

        slideAnim.setValue(translateX);

        backdropAnim.setValue(
          Math.min(1, Math.max(0, dx / DRAWER_WIDTH))
        );
      },

      onPanResponderRelease: (_, gesture) => {
        if (!edgeGestureActive.current) return;

        edgeGestureActive.current = false;

        const shouldOpen =
          gesture.dx >= SWIPE_OPEN_THRESHOLD ||
          gesture.vx > 0.45;

        if (shouldOpen) {
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              friction: 8,
              tension: 70,
              useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          closeMenu();
        }
      },

      onPanResponderTerminate: () => {
        edgeGestureActive.current = false;

        if (menuVisible) {
          closeMenu();
        }
      },
    })
  ).current;

  // ============================================================
  // GESTO PARA CERRAR EL DRAWER DESLIZANDO HACIA LA IZQUIERDA
  // ============================================================

  const drawerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const horizontal =
          Math.abs(gesture.dx) > Math.abs(gesture.dy);

        return (
          menuVisible &&
          horizontal &&
          gesture.dx < -8
        );
      },

      onPanResponderMove: (_, gesture) => {
        if (!menuVisible) return;

        const translateX = Math.min(
          0,
          Math.max(-DRAWER_WIDTH, gesture.dx)
        );

        slideAnim.setValue(translateX);

        backdropAnim.setValue(
          Math.min(
            1,
            Math.max(
              0,
              1 + gesture.dx / DRAWER_WIDTH
            )
          )
        );
      },

      onPanResponderRelease: (_, gesture) => {
        if (!menuVisible) return;

        const shouldClose =
          gesture.dx <= -SWIPE_CLOSE_THRESHOLD ||
          gesture.vx < -0.5;

        if (shouldClose) {
          closeMenu();
        } else {
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              friction: 8,
              tension: 70,
              useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },

      onPanResponderTerminate: () => {
        if (menuVisible) {
          closeMenu();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      {/* ======================================================
          ZONA INVISIBLE DE GESTO
          Solo existe en el borde izquierdo y no tiene ningún
          botón visible.
      ====================================================== */}

      {!menuVisible && (
        <View
          pointerEvents="box-only"
          {...edgePanResponder.panHandlers}
          style={[
            styles.edgeSwipeZone,
            {
              top: insets.top,
              bottom: insets.bottom,
            },
          ]}
        />
      )}

      {/* ======================================================
          DRAWER
      ====================================================== */}

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeMenu()}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          {/* BACKDROP */}

          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.backdropContainer,
              {
                opacity: backdropAnim,
              },
            ]}
          >
            <Pressable
              style={styles.backdrop}
              onPress={() => closeMenu()}
            />
          </Animated.View>

          {/* DRAWER */}

          <Animated.View
            {...drawerPanResponder.panHandlers}
            style={[
              styles.drawer,
              {
                paddingTop: Math.max(insets.top + 16, 28),
                paddingBottom: Math.max(insets.bottom + 12, 20),
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* HEADER */}

            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrand}>
                <View style={styles.drawerBrandIcon}>
                  <Ionicons
                    name="storefront-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>

                <View>
                  <Text style={styles.drawerTitle}>
                    MenuDays
                  </Text>

                  <Text style={styles.drawerSubtitle}>
                    Panel del restaurante
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => closeMenu()}
                hitSlop={12}
                activeOpacity={0.7}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* ==================================================
                MENU
            ================================================== */}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.menuContent}
              bounces={false}
            >
              <Text style={styles.sectionTitle}>
                PRINCIPAL
              </Text>

              <MenuItem
                icon="grid-outline"
                label="Dashboard"
                onPress={() =>
                  goTo("/(restaurant)/dashboard")
                }
              />

              <MenuItem
                icon="person-outline"
                label="Mi perfil"
                onPress={() =>
                  goTo("/(restaurant)/perfil")
                }
              />

              <MenuItem
                icon="restaurant-outline"
                label="Menús"
                onPress={() =>
                  goTo("/(restaurant)/menu")
                }
              />

              <MenuItem
                icon="fast-food-outline"
                label="Platos"
                onPress={() =>
                  goTo("/(restaurant)/platos")
                }
              />

              <MenuItem
                icon="pricetag-outline"
                label="Promociones"
                onPress={() =>
                  goTo("/(restaurant)/promociones")
                }
              />

              <MenuItem
                icon="images-outline"
                label="Galería"
                onPress={() =>
                  goTo("/(restaurant)/gallery")
                }
              />

              <MenuItem
                icon="location-outline"
                label="Mi local"
                onPress={() =>
                  goTo("/(restaurant)/mi-local")
                }
              />

              <Text style={styles.sectionTitle}>
                GESTIÓN
              </Text>

              <MenuItem
                icon="receipt-outline"
                label="Mis pedidos"
                onPress={() =>
                  goTo("/(restaurant)/mi-local")
                }
              />

              <Text style={styles.sectionTitle}>
                CONFIGURACIÓN
              </Text>

              <MenuItem
                icon="bicycle-outline"
                label="Configurar delivery"
                onPress={() =>
                  goTo(
                    "/(restaurant)/configurar-delivery"
                  )
                }
              />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// ITEM DEL MENU
// ============================================================

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function MenuItem({
  icon,
  label,
  onPress,
}: MenuItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <Text style={styles.menuItemText}>
        {label}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={colors.placeholder}
      />
    </TouchableOpacity>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    // Zona invisible para iniciar el swipe.
    // No hay botón ni cuadrado visible.
    edgeSwipeZone: {
      position: "absolute",
      left: 0,
      width: EDGE_SWIPE_WIDTH,
      zIndex: 999,
    },

    overlay: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: "transparent",
    },

    backdropContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
    },

    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
    },

    drawer: {
      width: DRAWER_WIDTH,
      height: "100%",
      backgroundColor: colors.card,
      paddingHorizontal: 18,
      elevation: 30,
      shadowColor: colors.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 18,
      shadowOffset: {
        width: 5,
        height: 0,
      },
      zIndex: 2,
    },

    drawerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    drawerBrand: {
      flexDirection: "row",
      alignItems: "center",
    },

    drawerBrandIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSecondary,
      marginRight: 11,
    },

    drawerTitle: {
      fontSize: 21,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: -0.4,
    },

    drawerSubtitle: {
      marginTop: 2,
      fontSize: 11.5,
      fontWeight: "500",
      color: colors.textSecondary,
    },

    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSecondary,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 16,
    },

    sectionTitle: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.textSecondary,
      letterSpacing: 1,
      marginBottom: 7,
      marginTop: 12,
    },

    menuContent: {
      paddingBottom: 30,
    },

    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 54,
      paddingHorizontal: 4,
      borderRadius: 14,
      marginBottom: 4,
    },

    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSecondary,
      marginRight: 12,
    },

    menuItemText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
  });