import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert } from "../common/AppAlert";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";
import { getNavbarSideMargin } from "../../../utils/navbarLayout";

interface NavItem {
  label: string;
  icon: string;
  activeIcon: string;
  // null = la pantalla todavía no existe; tocar el ítem avisa en
  // vez de navegar a una ruta rota.
  route: string | null;
}

// 2 a la izquierda del "+" y 2 a la derecha -> el "+" queda centrado.
const LEFT_ITEMS: NavItem[] = [
  { label: "Menús", icon: "restaurant-outline", activeIcon: "restaurant", route: "/(restaurant)/menu" },
  { label: "Inicio", icon: "home-outline", activeIcon: "home", route: "/(restaurant)/dashboard" },
];
const RIGHT_ITEMS: NavItem[] = [
  { label: "Mi Local", icon: "storefront-outline", activeIcon: "storefront", route: "/(restaurant)/mi-local" },
  { label: "Perfil", icon: "person-outline", activeIcon: "person", route: "/(restaurant)/perfil" },
];

// El "+" central lleva DIRECTO a la pantalla de crear menú que ya existe
// (misma ruta que usa la quick action del dashboard), sin duplicar
// pantalla ni lógica.
const CREATE_MENU_ROUTE = "/(restaurant)/menu/form";

function stripGroups(route: string) {
  return (
    route
      .split("/")
      .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
      .join("/") || "/"
  );
}

export default function RestaurantBottomNav() {
  const pathname = usePathname();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sideMargin = getNavbarSideMargin(width);

  function renderItem(item: NavItem) {
    const cleanRoute = item.route ? stripGroups(item.route) : null;
    const isActive =
      cleanRoute !== null &&
      (pathname === cleanRoute ||
        (cleanRoute !== "/" && pathname.startsWith(cleanRoute)));

    function handlePress() {
      if (item.route === null) {
        AppAlert.alert("Muy pronto", "Esta sección todavía no está disponible.");
        return;
      }
      router.push(item.route as any);
    }

    return (
      <TouchableOpacity
        key={item.label}
        style={styles.item}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
          <Ionicons
            name={(isActive ? item.activeIcon : item.icon) as any}
            size={22}
            color={isActive ? colors.primary : (isDark ? colors.placeholder : "#9E9E9E")}
          />
        </View>
        <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea} pointerEvents="box-none">
      {/* paddingTop reserva el espacio que el "+" sobresale hacia arriba
          -> el botón queda DENTRO de los límites de este wrapper y es
          100% táctil en Android (donde lo que se dibuja fuera del padre
          no recibe toques). */}
      <View style={styles.raisedRoom} pointerEvents="box-none">
        <View style={[styles.container, { marginHorizontal: sideMargin }]}>
          {LEFT_ITEMS.map(renderItem)}

          <View style={styles.plusSlot}>
            <TouchableOpacity
              style={styles.plusButton}
              activeOpacity={0.85}
              onPress={() => router.push(CREATE_MENU_ROUTE as any)}
              accessibilityLabel="Crear menú"
            >
              <LinearGradient
                colors={["#FFB74D", "#FB8C00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.plusGradient}
              >
                <Ionicons name="add" size={30} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {RIGHT_ITEMS.map(renderItem)}
        </View>
      </View>
    </SafeAreaView>
  );
}

const PLUS_SIZE = 56;
const PLUS_RAISE = 16;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "transparent",
    },
    raisedRoom: {
      paddingTop: PLUS_RAISE,
    },
    container: {
      flexDirection: "row",
      backgroundColor: colors.navbarBackground,
      borderRadius: 20,
      paddingTop: 8,
      paddingBottom: 9,
      paddingHorizontal: 6,
      marginBottom: 10,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 10,
    },
    item: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingHorizontal: 2,
    },
    iconWrap: {
      width: 40,
      height: 26,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapActive: {
      backgroundColor: colors.surfaceSecondary,
    },
    label: {
      fontSize: 10.5,
      // lineHeight lo pone textDefaults (~fontSize*1.4) -> caja de texto
      // holgada para la "ú" de "Menús" sin recorte, en cualquier Android.
      color: colors.textSecondary,
      fontWeight: "600",
    },
    labelActive: {
      color: colors.primary,
      fontWeight: "800",
    },
    // Ancho fijo (no flex) para que no le robe espacio de forma despareja
    // a los 2+2 ítems. El botón se dibuja subido, dentro del paddingTop
    // del wrapper.
    plusSlot: {
      width: PLUS_SIZE + 8,
      alignItems: "center",
    },
    plusButton: {
      width: PLUS_SIZE,
      height: PLUS_SIZE,
      borderRadius: PLUS_SIZE / 2,
      marginTop: -PLUS_RAISE,
      overflow: "hidden",
      borderWidth: 4,
      borderColor: colors.navbarBackground,
      shadowColor: "#FB8C00",
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 9,
    },
    plusGradient: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });
