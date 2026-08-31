import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  // Foto temática opcional (menú/promociones/platos/galería, etc.) --
  // se muestra como acento fotográfico a la derecha, no como fondo
  // completo, para que el header siga siendo compacto y liviano.
  imageSource?: any;
}

export default function ScreenHeader({
  title,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
  imageSource,
}: ScreenHeaderProps) {
  return (
    // La sombra vive en este wrapper (sin overflow:hidden) -- el header
    // de adentro sí lo necesita para recortar la imagen/degradado con
    // las esquinas redondeadas, y en Android una sombra en el mismo
    // nodo que overflow:hidden queda recortada junto con el contenido.
    <View style={styles.shadowWrap}>
      <View style={styles.header}>
        <LinearGradient
          colors={["#FFC266", "#FB8C00", "#F5751A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {imageSource ? (
          <>
            {/* La foto ocupa TODO el header (no un acento a la derecha).
                `cover` la escala para llenar el alto y el ancho completos
                sin deformarla (recorta lo que sobra). */}
            <Image
              source={imageSource}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              allowDownscaling={false}
            />
            {/* Scrim cálido diagonal: oscurece lo justo para que el título
                blanco y los iconos se lean, dejando ver la foto por
                debajo. Más marcado abajo-izquierda (donde va el texto). */}
            <LinearGradient
              colors={[
                "rgba(120,55,5,0.30)",
                "rgba(150,70,8,0.42)",
                "rgba(90,42,4,0.66)",
              ]}
              locations={[0, 0.55, 1]}
              start={{ x: 0.7, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {/* Fade vertical arriba/abajo -- la foto se funde con los
                bordes redondeados del header en vez de cortar recto. */}
            <LinearGradient
              colors={["rgba(20,12,4,0.28)", "rgba(20,12,4,0)", "rgba(20,12,4,0.34)"]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </>
        ) : (
          // Sin foto: un glow suave en la esquina en vez de un color
          // plano sin ningún relieve.
          <LinearGradient
            colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.25, y: 0.9 }}
            style={styles.glow}
          />
        )}

        {/* Reflejo sutil arriba -- mismo lenguaje "glass" que el resto
            de la app premium, refuerza la sensación de profundidad. */}
        <LinearGradient
          colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topHighlight}
          pointerEvents="none"
        />

        <SafeAreaView edges={["top"]}>
          <View style={styles.row}>
            {showBack ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onBack ?? (() => router.back())}
                hitSlop={10}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconButtonPlaceholder} />
            )}

            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            {rightIcon ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onRightPress}
                hitSlop={10}
              >
                <Ionicons
                  name={rightIcon}
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconButtonPlaceholder} />
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: "#8A4A00",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    position: "relative",
  },

  glow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
  },

  topHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 46,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  iconButtonPlaceholder: {
    width: 34,
    height: 34,
  },

  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.2,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
