import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Shadow } from "react-native-shadow-2";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ClocheIcon from "../components/home/ClocheIcon";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

function TabIcon({
  name,
  color,
  focused,
}: {
  name: any;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={staticStyles.iconWrapper}>
      <Ionicons
        name={name}
        size={24}
        color={color}
      />
      {focused && <View style={staticStyles.dot} />}
    </View>
  );
}

// Estilos que no dependen del tema (el punto activo es siempre naranja de
// marca), separados de createStyles() para que TabIcon no necesite
// useTheme() propio.
const staticStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFA726",
  },
});

export default function TabLayout() {
  // "bottom: 18" solo (ver styles.tabBar) no alcanza en dispositivos con
  // barra de navegación de Android (botones físicos/virtuales) -- ahí el
  // inset real es mucho más alto que 18 y la tab bar queda tapada. Con
  // gestos (barra fina) el inset es chico y casi no se nota, por eso en
  // algunos celulares se ve bien y en otros no.
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { bottom: 18 + insets.bottom }],
        tabBarActiveTintColor: "#FFA726",
        tabBarInactiveTintColor: colors.placeholder,
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
        name="restaurante-catalogo"
        options={{
          // Se accede desde el botón "Ver Menú" del detalle de restaurante,
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
      <Tabs.Screen name="restaurant-gallery" options={{ href: null }} />
      <Tabs.Screen name="restaurant-reviews" options={{ href: null }} />
      <Tabs.Screen name="restaurant-menu-history" options={{ href: null }} />

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

      {/* Se accede desde el botón "Dejar reseña" de pedido-detalle.tsx
          (solo visible con estado "entregado"), no es un tab. */}
      <Tabs.Screen name="crear-resena" options={{ href: null }} />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  tabBar: {
    position: "absolute",

    left: 16,
    right: 16,
    bottom: 18,

    height: 74,

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
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  centerButton: {
    width: 62,
    height: 62,
    borderRadius: 31,

    backgroundColor: "#FFA726",

    justifyContent: "center",
    alignItems: "center",

    marginTop: -22,

    borderWidth: 4,
    borderColor: colors.navbarBackground,
  },
});