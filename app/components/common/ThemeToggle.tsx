import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";

interface ThemeToggleProps {
  /** Tamaño total del control (alto). Ancho = size * 1.8. Default 36. */
  size?: number;
}

// Toggle tipo "pill" con el sol/luna deslizando de lado a lado, en el
// naranja de marca -- pensado para vivir en una fila de Configuración,
// junto a un label ("Tema oscuro").
export default function ThemeToggle({ size = 36 }: ThemeToggleProps) {
  const { isDark, toggleTheme, colors } = useTheme();
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [isDark]);

  const width = size * 1.8;
  const knobSize = size - 6;
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.primary, colors.surfaceSecondary],
  });
  const knobTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, width - knobSize - 3],
  });

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel="Cambiar tema claro u oscuro"
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width,
            height: size,
            borderRadius: size / 2,
            backgroundColor: trackColor,
            borderColor: colors.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            {
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
              backgroundColor: colors.card,
              transform: [{ translateX: knobTranslate }],
            },
          ]}
        >
          <Ionicons
            name={isDark ? "moon" : "sunny"}
            size={knobSize * 0.6}
            color={isDark ? colors.primaryLight : colors.primary}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: "center",
    borderWidth: 1,
  },
  knob: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
