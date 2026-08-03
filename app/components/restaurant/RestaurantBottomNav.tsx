import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppAlert } from "../common/AppAlert";

interface NavItem {
  label: string;
  icon: string;
  activeIcon: string;
  // null = la pantalla todavía no existe; tocar el ítem avisa en
  // vez de navegar a una ruta rota.
  route: string | null;
}

const ITEMS: NavItem[] = [
  { label: "Inicio", icon: "home-outline", activeIcon: "home", route: "/(restaurant)/dashboard" },
  { label: "Menús", icon: "restaurant-outline", activeIcon: "restaurant", route: "/(restaurant)/menu" },
  { label: "Mi Local", icon: "storefront-outline", activeIcon: "storefront", route: "/(restaurant)/mi-local" },
  { label: "Perfil", icon: "person-outline", activeIcon: "person", route: "/(restaurant)/perfil" },
];

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

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        {ITEMS.map((item) => {
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
                  color={isActive ? "#F5A800" : "#9E9E9E"}
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconWrap: {
    width: 38,
    height: 28,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#FFF6E2",
  },
  label: {
    fontSize: 10,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  labelActive: {
    color: "#F5A800",
    fontWeight: "800",
  },
});