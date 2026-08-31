import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// react-native-maps no tiene implementación para web (el native module
// no existe ahí -- MapView revienta en runtime apenas se monta). Este
// archivo reemplaza automáticamente a SafeMapView.tsx cuando el bundle
// target es "web" (convención *.web.tsx de Metro), así que ni
// MapLocationPicker.tsx ni restaurante-detalle.tsx necesitan tocar nada:
// en nativo siguen usando el MapView real de siempre.
//
// Es solo para la Device Preview (correr el proyecto en el navegador y
// testear el layout responsive) -- no pretende ser un mapa real. Sí
// simula el gesto de "tocar el mapa para elegir ubicación": un tap
// adentro mueve el pin y llama a onPress con una coordenada aproximada,
// calculada linealmente a partir de la posición del click y el
// delta de la región activa, para poder seguir probando ese flujo
// visualmente sin un mapa de verdad.

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const PROVIDER_GOOGLE = "google";

export function Marker(_props: any) {
  return null;
}

interface SafeMapViewProps {
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onPress?: (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => void;
  children?: React.ReactNode;
  [key: string]: any;
}

const SafeMapView = forwardRef<any, SafeMapViewProps>(function SafeMapView(
  { style, initialRegion, region, onPress, children },
  ref
) {
  const activeRegion = region ?? initialRegion;
  const [size, setSize] = useState({ width: 0, height: 0 });

  // MapLocationPicker llama a mapRef.current?.animateToRegion(...) tras
  // "Usar mi ubicación actual" -- acá no hay animación real, pero exponer
  // un no-op evita tener que tocar ese código con un Platform.OS check.
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
  }));

  function handlePress(e: any) {
    if (!onPress || !activeRegion || size.width === 0 || size.height === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    const latitude =
      activeRegion.latitude + (0.5 - locationY / size.height) * activeRegion.latitudeDelta;
    const longitude =
      activeRegion.longitude + (locationX / size.width - 0.5) * activeRegion.longitudeDelta;
    onPress({ nativeEvent: { coordinate: { latitude, longitude } } });
  }

  return (
    <Pressable
      style={[styles.container, style]}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      onPress={handlePress}
    >
      <View style={styles.grid} />
      <Ionicons name="location" size={34} color="#FB8C00" style={styles.pin} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Vista previa web</Text>
        <Text style={styles.badgeSubtext}>
          {onPress
            ? "Tocá para simular un punto -- el mapa real corre en la app nativa"
            : "El mapa interactivo real corre en la app nativa (iOS/Android)"}
        </Text>
      </View>
      {children}
    </Pressable>
  );
});

export default SafeMapView;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EAE3D8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#DDD3C0",
  },
  pin: {
    marginBottom: 8,
  },
  badge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3E2723",
    textAlign: "center",
  },
  badgeSubtext: {
    fontSize: 9.5,
    color: "#8A8A8A",
    textAlign: "center",
    marginTop: 2,
  },
});
