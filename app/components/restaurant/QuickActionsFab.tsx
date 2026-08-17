import React, { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface QuickActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface QuickActionsFabProps {
  actions: QuickActionItem[];
}

// FAB expandible del Dashboard de restaurante: mismo criterio visual que
// PublishFab.tsx (gradiente naranja de marca, mismo offset vertical
// "84 + insets.bottom" para no pisar RestaurantBottomNav en ningún
// tamaño de pantalla), pero acá se abre en un mini menú de accesos
// rápidos en vez de navegar directo -- las 4 acciones reutilizan rutas
// que ya existen (menu/form, promociones/form, platos/form, gallery),
// no crean pantallas nuevas.
//
// Una sola Animated.Value (progress, 0=cerrado -> 1=abierto) maneja todo:
// la rotación del ícono (+ -> x), el fade del backdrop y el stagger de
// las 4 opciones -- así queda una sola animación coherente en vez de
// varias sueltas, y es fácil de revertir (progress vuelve a 0) sin
// lógica extra al cerrar.
export default function QuickActionsFab({ actions }: QuickActionsFabProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    Animated.spring(progress, {
      toValue: next ? 1 : 0,
      friction: 9,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }

  function close() {
    if (!isOpen) return;
    setIsOpen(false);
    Animated.spring(progress, {
      toValue: 0,
      friction: 9,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }

  function handleActionPress(action: QuickActionItem) {
    close();
    action.onPress();
  }

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <>
      {/* Backdrop muy sutil: solo para poder tocar afuera y cerrar, sin
          tapar el dashboard de forma pesada. No intercepta touches
          cuando está cerrado (pointerEvents "none"). */}
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={[styles.wrapper, { bottom: 84 + insets.bottom, right: 18 }]}
      >
        <View pointerEvents={isOpen ? "box-none" : "none"} style={styles.actionsColumn}>
          {actions.map((action, index) => {
            // Stagger: cada opción arranca su aparición un poco más tarde
            // que la anterior, usando la misma progress -- sin timers
            // encadenados a mano.
            const start = index * 0.12;
            const itemOpacity = progress.interpolate({
              inputRange: [start, Math.min(start + 0.45, 1), 1],
              outputRange: [0, 1, 1],
              extrapolate: "clamp",
            });
            const itemTranslateY = progress.interpolate({
              inputRange: [start, Math.min(start + 0.45, 1), 1],
              outputRange: [14, 0, 0],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={action.label}
                style={[
                  styles.actionRow,
                  { opacity: itemOpacity, transform: [{ translateY: itemTranslateY }] },
                ]}
              >
                <View style={styles.actionLabelPill}>
                  <Text style={styles.actionLabelText}>{action.label}</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.85}
                  onPress={() => handleActionPress(action)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name={action.icon} size={20} color="#FB8C00" />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.fab} activeOpacity={0.88} onPress={toggle}>
          <LinearGradient
            colors={["#FFB74D", "#FB8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,15,10,0.22)",
    zIndex: 40,
  },
  wrapper: {
    position: "absolute",
    alignItems: "flex-end",
    zIndex: 50,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: "hidden",
    shadowColor: "#FB8C00",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsColumn: {
    alignItems: "flex-end",
    marginBottom: 14,
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionLabelPill: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  actionLabelText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#2A2A2A",
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
