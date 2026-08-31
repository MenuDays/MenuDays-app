import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Shadow } from "react-native-shadow-2";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ClocheIcon from "../../components/home/ClocheIcon";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

// Acá viven SOLO los 5 tabs reales (Inicio/Explorar/Menús/Pedidos/Perfil).
// Todo lo demás (detalle de restaurante, catálogo, flujo de pedido, etc.)
// vive un nivel arriba, en app/(home)/_layout.tsx, dentro de un <Stack>
// real -- así el botón "atrás" de esas pantallas hace un pop real de la
// pila de navegación en vez de comportarse como el historial de tabs de
// React Navigation (que no es un push/pop lineal y podía mandar "para
// cualquier lado" al volver).

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
        // Transparente -> deja ver el fondo global de <AppBackground>
        // (fondo_claro / fondo_oscuro) en todas las tabs del comensal.
        sceneStyle: { backgroundColor: "transparent" },
        tabBarStyle: [styles.tabBar, { bottom: 18 + insets.bottom }],
        tabBarActiveTintColor: "#FFA726",
        tabBarInactiveTintColor: colors.placeholder,
        tabBarLabelStyle: styles.tabLabel,
        // Sin esto, en un build standalone (a diferencia de Expo Go) el
        // label podía crecer según el "tamaño de fuente" del sistema del
        // celular y quedar cortado contra el alto fijo de la tab bar --
        // las otras navbars (restaurante/admin) son Views custom sin alto
        // fijo, por eso nunca les pasaba esto.
        tabBarAllowFontScaling: false,
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
        // El botón central es el LOGO de la marca (la cloche): al tocarlo
        // el comensal espera volver al Inicio, no entrar a una pantalla de
        // "Menús" suelta.
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("index");
          },
        })}
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
              allowFontScaling={false}
              style={[
                styles.tabLabel,
                { color, marginTop: 7 },
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

    height: 82,

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

    paddingTop: 6,
    paddingBottom: 8,
  },

  tabLabel: {
    fontSize: 11,
    // ~1.45x -> caja holgada para la "ú" de "Menús" sin recorte.
    lineHeight: 16,
    fontWeight: "600",
    // baja el texto un poco -> no se pega al ícono ni se corta arriba.
    marginTop: 5,
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
