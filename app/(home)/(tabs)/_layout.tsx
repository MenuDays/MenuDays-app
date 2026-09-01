import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
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
    // Caja de tamaño FIJO: el punto activo va posicionado en absoluto, no
    // en el flujo -- así al enfocar/desenfocar un tab el ícono no se
    // mueve ni empuja al resto (antes el `gap:4` + el punto condicional
    // cambiaban la altura de la caja al cambiar de sección).
    <View style={staticStyles.iconWrapper}>
      <Ionicons
        name={name}
        size={24}
        color={color}
      />
      <View style={[staticStyles.dot, !focused && staticStyles.dotHidden]} />
    </View>
  );
}

// Estilos que no dependen del tema (el punto activo es siempre naranja de
// marca), separados de createStyles() para que TabIcon no necesite
// useTheme() propio.
const staticStyles = StyleSheet.create({
  iconWrapper: {
    width: 40,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFA726",
  },
  dotHidden: {
    opacity: 0,
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

          // Botón central (logo cloche). Antes iba envuelto en <Shadow>
          // de react-native-shadow-2: esa librería mide el hijo y dibuja
          // la sombra en una capa aparte, y al cambiar de tab (re-render
          // de la tab bar) esa medición llegaba tarde -> la sombra
          // aparecía un instante descolocada arriba a la izquierda (el
          // "ícono raro" que se veía correrse). Ahora es una sombra
          // nativa normal, igual que el botón "+" de la navbar de
          // restaurante -- sin capa que medir, sin salto.
          tabBarIcon: () => (
            <View style={styles.centerButton}>
              <ClocheIcon size={26} color="#FFFFFF" />
            </View>
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

    // Sombra nativa (reemplaza al <Shadow> de react-native-shadow-2).
    shadowColor: "#FB8C00",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
