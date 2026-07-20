import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

interface NavItem {
  label: string;
  icon: string;
  activeIcon: string;
  route: string;
}

const ITEMS: NavItem[] = [
  { label: "Inicio", icon: "home-outline", activeIcon: "home", route: "/(admin)/dashboard" },
  { label: "Solicitudes", icon: "clipboard-outline", activeIcon: "clipboard", route: "/(admin)/solicitudes" },
  { label: "Moderación", icon: "shield-outline", activeIcon: "shield", route: "/(admin)/moderacion" },
  { label: "Perfil", icon: "person-outline", activeIcon: "person", route: "/(admin)/perfil" },
];

// Saca los segmentos de grupo "(algo)" para poder comparar contra usePathname()
function stripGroups(route: string) {
  return route
    .split("/")
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .join("/") || "/";
}

export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
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
          >
            <Ionicons
              name={(isActive ? item.activeIcon : item.icon) as any}
              size={22}
              color={isActive ? "#FB8C00" : "#9E9E9E"}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    marginHorizontal: 18,
    marginBottom: 12,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  labelActive: {
    color: "#FB8C00",
    fontWeight: "700",
  },
});