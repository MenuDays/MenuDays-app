import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { Shadow } from "react-native-shadow-2";

import ClocheIcon from "../components/home/ClocheIcon";

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
    <View style={styles.iconWrapper}>
      <Ionicons
        name={name}
        size={24}
        color={color}
      />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#FFA726",
        tabBarInactiveTintColor: "#3E2723",
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
        name="favoritos"
        options={{
          // Sigue existiendo como ruta (se accede desde Perfil),
          // pero ya no aparece como tab en la barra inferior.
          href: null,
        }}
      />

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
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",

    left: 16,
    right: 16,
    bottom: 18,

    height: 74,

    backgroundColor: "#FFFFFF",

    borderRadius: 38,
    borderTopWidth: 0,

    elevation: 12,

    shadowColor: "#000",
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

  centerButton: {
    width: 62,
    height: 62,
    borderRadius: 31,

    backgroundColor: "#FFA726",

    justifyContent: "center",
    alignItems: "center",

    marginTop: -22,

    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
});