import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Shadow } from "react-native-shadow-2";

import ClocheIcon from "../components/home/ClocheIcon";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";
import { usePreviewMode } from "../../contexts/PreviewModeContext";

function TabIcon({
  name,
  color,
  focused,
  dotColor,
}: {
  name: any;
  color: string;
  focused: boolean;
  dotColor: string;
}) {
  return (
    <View style={iconWrapperStyle}>
      <Ionicons
        name={name}
        size={24}
        color={color}
      />
      {focused && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: dotColor,
          }}
        />
      )}
    </View>
  );
}

const iconWrapperStyle = { alignItems: "center" as const, gap: 4 };

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { previewOrigin, exitPreview } = usePreviewMode();

  // Margen lateral responsive: chico en celulares angostos, con más aire
  // en celulares grandes, tope en tablets para que no quede flotando
  // demasiado lejos de los bordes.
  const sideMargin = Math.max(12, Math.min(28, width * 0.045));

  function handleExitPreview() {
    exitPreview();
    router.replace(previewOrigin === "administrador" ? "/(admin)/dashboard" : "/(restaurant)/dashboard");
  }

  return (
    <View style={{ flex: 1 }}>
      {previewOrigin && (
        <TouchableOpacity
          style={[styles.previewBanner, { top: insets.top + 8 }]}
          onPress={handleExitPreview}
          activeOpacity={0.85}
        >
          <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
          <Text style={styles.previewBannerText}>Viendo como comensal</Text>
          <View style={styles.previewBannerDivider} />
          <Text style={styles.previewBannerLink}>
            Volver a {previewOrigin === "administrador" ? "administrador" : "restaurante"}
          </Text>
          <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            left: sideMargin + insets.left,
            right: sideMargin + insets.right,
            bottom: Math.max(18, insets.bottom + 8),
          },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              color={color}
              focused={focused}
              dotColor={colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explorar"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "search" : "search-outline"}
              color={color}
              focused={focused}
              dotColor={colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="menus"
        options={{
          title: "Menús",

          tabBarIcon: () => (
            <Shadow
              distance={4}
              offset={[0, -22]}
              startColor="rgba(251,140,0,0.60)"
              endColor="rgba(251,140,0,0)"
              paintInside={false}
            >
              <View style={styles.centerButton}>
                <ClocheIcon
                  size={26}
                  color="#FFFFFF"
                />
              </View>
            </Shadow>
          ),

          tabBarLabel: ({ color }) => (
            <Text
              numberOfLines={1}
              style={[
                styles.tabLabel,
                { color, marginTop: 4 },
              ]}
            >
              Menús
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "receipt" : "receipt-outline"}
              color={color}
              focused={focused}
              dotColor={colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="restaurantes"
        options={{
          // Sigue existiendo como ruta (se accede desde la flecha de
          // la sección "Restaurantes" en Inicio), pero no es un tab.
          href: null,
        }}
      />

      <Tabs.Screen
        name="explorar-resultados"
        options={{
          // Se accede desde "Explorar" al aplicar filtros/buscar, pero
          // no tiene que aparecer como tab propio en la barra inferior.
          href: null,
        }}
      />

      <Tabs.Screen
        name="restaurante-detalle"
        options={{
          // Se accede desde una card de restaurante (listado/explorar),
          // no es un tab.
          href: null,
        }}
      />

      <Tabs.Screen
        name="favoritos"
        options={{
          // Sigue existiendo como ruta (se accede desde Perfil),
          // pero ya no aparece como tab en la barra inferior.
          href: null,
        }}
      />

      {/* Se accede desde los botones "Ver histórico" / "Ver todas" /
          "Ver las N reseñas" del detalle de restaurante, no son tabs. */}
      <Tabs.Screen name="restaurant-menu-history" options={{ href: null }} />
      <Tabs.Screen name="restaurant-gallery" options={{ href: null }} />
      <Tabs.Screen name="restaurant-reviews" options={{ href: null }} />

      {/* Flujo de pedido (mockeado, ver TODOs en cada pantalla y en
          services/order.service.ts). Se accede desde el detalle de un
          producto (plato/menú/promoción), no son tabs. */}
      <Tabs.Screen name="pedido-producto" options={{ href: null }} />
      <Tabs.Screen name="pedido-entrega" options={{ href: null }} />
      <Tabs.Screen name="pedido-confirmar" options={{ href: null }} />

      <Tabs.Screen
        name="pedido-detalle"
        options={{
          // Detalle de un pedido ya existente (vista comensal, solo
          // lectura) -- se accede desde la lista en "Pedidos", no es
          // un tab en sí.
          href: null,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              color={color}
              focused={focused}
              dotColor={colors.primary}
            />
          ),
        }}
      />
      </Tabs>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    previewBanner: {
      position: "absolute",
      alignSelf: "center",
      zIndex: 50,
      elevation: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FB8C00",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    previewBannerText: {
      fontSize: 11.5,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    previewBannerDivider: {
      width: 1,
      height: 12,
      backgroundColor: "rgba(255,255,255,0.4)",
      marginHorizontal: 2,
    },
    previewBannerLink: {
      fontSize: 11.5,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    tabBar: {
      position: "absolute",

      minHeight: 74,

      backgroundColor: colors.navbarBackground,

      borderRadius: 38,
      borderTopWidth: 0,

      elevation: 12,

      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.12,
      shadowRadius: 10,

      paddingTop: 8,
      paddingBottom: 6,
    },

    tabLabel: {
      fontSize: 11,
      fontWeight: "600",
    },

    centerButton: {
      width: 62,
      height: 62,
      borderRadius: 31,

      backgroundColor: colors.primary,

      justifyContent: "center",
      alignItems: "center",

      marginTop: -22,

      borderWidth: 4,
      borderColor: colors.navbarBackground,
    },
  });