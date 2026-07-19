import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SolicitudHeaderProps {
  /** Primera línea del título, peso normal (ej: "Solicitudes de") */
  title: string;
  /** Segunda línea, destacada en color (ej: "Restaurantes") */
  highlight: string;
  /** Texto chico debajo, con barra de acento a la izquierda */
  subtitle?: string;
  /** Se llama al tocar el botón de menú (hamburguesa) arriba a la izquierda */
  onMenuPress?: () => void;
}

// Alto "de diseño" del header, sin contar la barra de estado.
// Igual filosofía que el header del dashboard: a esto le sumamos
// insets.top para que la imagen llegue detrás del reloj/batería.
const HEADER_HEIGHT = 260;

export default function SolicitudHeader({
  title,
  highlight,
  subtitle,
  onMenuPress,
}: SolicitudHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      // TODO: confirmar nombre/ubicación real del archivo de imagen
      source={require("../../../assets/images/solicitudHeader.png")}
      style={[styles.header, { height: HEADER_HEIGHT + insets.top }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <TouchableOpacity
        style={[styles.menuButton, { top: insets.top + 16 }]}
        onPress={onMenuPress}
      >
        <Ionicons name="menu" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.highlight}>{highlight}</Text>

        {subtitle ? (
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleBar} />
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        ) : null}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,10,5,0.55)",
  },
  menuButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(120,50,20,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 32,
  },
  highlight: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFC24D",
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtitleBar: {
    width: 3,
    height: 28,
    borderRadius: 2,
    backgroundColor: "#FB8C00",
  },
  subtitle: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
});