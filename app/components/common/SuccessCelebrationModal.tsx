import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const mascot = require("../../../assets/images/nene-festejo.png");

interface SuccessCelebrationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttonLabel?: string;
}

// Cartelito de éxito reutilizable -- se muestra después de publicar un
// menú, plato, promoción o foto de galería, con la mascota festejando
// en vez de simplemente volver a la pantalla anterior en silencio.
export default function SuccessCelebrationModal({
  visible,
  title,
  message,
  onClose,
  buttonLabel = "¡Genial!",
}: SuccessCelebrationModalProps) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const mascotBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.7);
    opacity.setValue(0);
    mascotBounce.setValue(0);

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(180),
        Animated.spring(mascotBounce, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.glow} />

          <Animated.View
            style={{
              transform: [
                {
                  translateY: mascotBounce.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
                {
                  scale: mascotBounce.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            }}
          >
            <Image source={mascot} style={styles.mascot} contentFit="contain" />
          </Animated.View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.88}>
            <LinearGradient
              colors={["#FFB74D", "#FB8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>{buttonLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(20,15,10,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  glow: {
    position: "absolute",
    top: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,183,64,0.28)",
  },
  mascot: {
    width: 148,
    height: 148,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#3E2723",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13.5,
    color: "#8A8A8A",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
  },
  buttonGradient: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
