import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";
import { getNavbarSideMargin } from "../../../utils/navbarLayout";

interface NavItem {
  label: string;
  icon: string;
  activeIcon: string;
  route: string;
}

const ITEMS: NavItem[] = [
  { label: "Inicio", icon: "home-outline", activeIcon: "home", route: "/(admin)/dashboard" },
  { label: "Solicitudes", icon: "clipboard-outline", activeIcon: "clipboard", route: "/(admin)/solicitudes" },
  { label: "Moderación", icon: "shield-checkmark-outline", activeIcon: "shield", route: "/(admin)/moderacion" },
  { label: "Perfil", icon: "person-outline", activeIcon: "person", route: "/(admin)/perfil" },
];

function stripGroups(route: string) {
  return route
    .split("/")
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .join("/") || "/";
}

export default function AdminBottomNav() {
  const pathname = usePathname();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sideMargin = getNavbarSideMargin(width);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea} pointerEvents="box-none">
      <View style={[styles.container, { marginHorizontal: sideMargin }]}>
        {ITEMS.map((item) => {
          const cleanRoute = stripGroups(item.route);
          const isActive =
            pathname === cleanRoute ||
            (cleanRoute !== "/" && pathname.startsWith(cleanRoute));
          return (
            <TouchableOpacity
              key={item.route}
              style={styles.item}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Ionicons
                  name={(isActive ? item.activeIcon : item.icon) as any}
                  size={22}
                  color={isActive ? colors.primary : (isDark ? colors.placeholder : "#9E9E9E")}
                />
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "transparent",
    },
    container: {
      flexDirection: "row",
      backgroundColor: colors.navbarBackground,
      borderRadius: 20,
      paddingTop: 8,
      paddingBottom: 9,
      paddingHorizontal: 4,
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
      fontSize: 10,
      // lineHeight lo pone textDefaults (~fontSize*1.4) -> caja holgada
      // para "Moderación" (ó) sin recorte, en cualquier Android.
      color: colors.textSecondary,
      fontWeight: "600",
    },
    labelActive: {
      color: colors.primary,
      fontWeight: "800",
    },
  });