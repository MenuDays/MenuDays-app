import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AppAlert } from "../common/AppAlert";

// Coordenadas por defecto de Ecuador
const ECUADOR_DEFAULT: Region = {
  latitude: -1.8312,
  longitude: -78.1834,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export interface MapLocationResult {
  latitude: number;
  longitude: number;
  address: string;
}

interface MapLocationPickerProps {
  /** Texto grande del header (ej: "Tu ubicación") */
  title: string;
  /** Texto chico debajo del título (ej: "Quito, Pichincha") */
  subtitle?: string;
  /** Texto del botón de confirmar (default: "Confirmar ubicación") */
  confirmLabel?: string;
  /** Se llama al tocar "Atrás" */
  onBack: () => void;
  /** Se llama al confirmar, con la ubicación + dirección elegidas */
  onConfirm: (result: MapLocationResult) => void | Promise<void>;
  /** Ubicación inicial del marcador, si ya hay una elegida previamente */
  initialLocation?: { latitude: number; longitude: number } | null;
  /**
   * Coordenadas del centro de la ciudad elegida en los pasos anteriores
   * (Provincia → Ciudad), ya resueltas por el backend (tabla ciudades).
   * Si no hay initialLocation, se usan para centrar el mapa ahí en vez
   * de en todo Ecuador -- sin geocoding, es directo.
   */
  cityCoords?: { latitude: number; longitude: number } | null;
}

export default function MapLocationPicker({
  title,
  subtitle,
  confirmLabel = "Confirmar ubicación",
  onBack,
  onConfirm,
  initialLocation,
  cityCoords,
}: MapLocationPickerProps) {
  const mapRef = useRef<MapView>(null);
  const startingPoint = initialLocation ?? cityCoords ?? ECUADOR_DEFAULT;
  const startingDelta = initialLocation
    ? { latitudeDelta: 0.005, longitudeDelta: 0.005 }
    : cityCoords
      ? { latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitudeDelta: ECUADOR_DEFAULT.latitudeDelta, longitudeDelta: ECUADOR_DEFAULT.longitudeDelta };
  const [region, setRegion] = useState<Region>({
    latitude: startingPoint.latitude,
    longitude: startingPoint.longitude,
    ...startingDelta,
  });
  const [marker, setMarker] = useState({
    latitude: startingPoint.latitude,
    longitude: startingPoint.longitude,
  });
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    // Si ya venía con una ubicación previa, no preguntamos nada:
    // solo geocodificamos esa ubicación y listo.
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
      setLoading(false);
      return;
    }

    // Sin ubicación previa: si hay coordenadas de la ciudad elegida,
    // el mapa ya arrancó centrado ahí (ver startingPoint arriba).
    // Solo resolvemos la dirección textual para mostrarla en el panel.
    if (cityCoords) {
      reverseGeocode(cityCoords.latitude, cityCoords.longitude);
    }

    setLoading(false);
    promptLocationChoice();
  }, []);

  function promptLocationChoice() {
    AppAlert.alert(
      "¿Cómo querés fijar tu ubicación?",
      "Podés usar tu ubicación actual o elegirla manualmente en el mapa.",
      [
        {
          text: "Elegir en el mapa",
          style: "cancel",
        },
        {
          text: "Usar mi ubicación actual",
          onPress: handleMyLocation,
        },
      ]
    );
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (results.length > 0) {
        const r = results[0];
        // Orden de prioridad: calle+numero > calle sola > barrio/sector > ciudad.
        // Antes esto quedaba en "" apenas faltaba street/streetNumber/district,
        // que es lo mas comun fuera de zonas urbanas bien mapeadas.
        const streetLine = [r.street, r.streetNumber].filter(Boolean).join(" ");
        const fallback = [r.district, r.subregion, r.city, r.region]
          .filter(Boolean)
          .join(", ");
        const resolved = streetLine || fallback;
        if (resolved) {
          setAddress(resolved);
        } else {
          AppAlert.alert(
            "No se pudo detectar la dirección",
            "Escribí la dirección manualmente para este punto."
          );
        }
      } else {
        AppAlert.alert(
          "No se pudo detectar la dirección",
          "Escribí la dirección manualmente para este punto."
        );
      }
    } catch (e) {
      console.log("Error en geocoding:", e);
      AppAlert.alert(
        "No se pudo obtener la dirección",
        "Revisá tu conexión o escribí la dirección manualmente."
      );
    }
  }

  async function handleMapPress(e: any) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    await reverseGeocode(latitude, longitude);
  }

  async function handleMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        AppAlert.alert(
          "Permiso denegado",
          "No se pudo acceder a tu ubicación. Podés elegirla manualmente tocando el mapa."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      setMarker({ latitude, longitude });
      mapRef.current?.animateToRegion(newRegion, 600);
      await reverseGeocode(latitude, longitude);
    } catch (e) {
      console.log("Error:", e);
    } finally {
      setLocating(false);
    }
  }

  async function handleConfirm() {
    if (!address.trim()) return;
    setConfirming(true);
    try {
      await onConfirm({
        latitude: marker.latitude,
        longitude: marker.longitude,
        address: address.trim(),
      });
    } finally {
      setConfirming(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5A800" />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker coordinate={marker} pinColor="#F5A800" />
          </MapView>
        )}

        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleMyLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#F5A800" />
          ) : (
            <Ionicons name="locate" size={22} color="#F5A800" />
          )}
        </TouchableOpacity>

        <View style={styles.hint}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color="#757575"
          />
          <Text style={styles.hintText}>
            Tocá el mapa para ajustar tu ubicación
          </Text>
        </View>
      </View>

      {/* Panel inferior */}
      <KeyboardAvoidingView
        // En Android, con android:windowSoftInputMode en "resize" (el default de
        // Expo), el sistema ya achica la ventana cuando aparece el teclado.
        // Si acá además usamos behavior="height", se descuenta el alto del
        // teclado dos veces y el panel queda mal calculado (tapa el input).
        // Por eso en Android no aplicamos ningún behavior extra.
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.bottomPanel}
      >
        <Text style={styles.addressLabel}>Dirección aproximada</Text>
        <View style={styles.addressInput}>
          <Ionicons
            name="location-outline"
            size={20}
            color="#F5A800"
            style={styles.addressIcon}
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Ej: Av. Amazonas N34-183"
            placeholderTextColor="#B7B7B7"
            style={styles.input}
            returnKeyType="done"
            selectionColor="#F5A800"
          />
          {address.length > 0 && (
            <TouchableOpacity onPress={() => setAddress("")}>
              <Ionicons name="close-circle" size={18} color="#BDBDBD" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.addressHint}>
          Podés editar la dirección si no es exacta
        </Text>

        <TouchableOpacity
          disabled={!address.trim() || confirming}
          onPress={handleConfirm}
          style={styles.confirmTouchable}
        >
          <LinearGradient
            colors={
              address.trim() ? ["#FFB640", "#F58A07"] : ["#D8D8D8", "#CFCFCF"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmButton}
          >
            {confirming ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#757575",
  },
  myLocationButton: {
    position: "absolute",
    right: 16,
    bottom: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  hint: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  hintText: {
    fontSize: 12,
    color: "#757575",
  },
  bottomPanel: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  addressInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "#FAFAFA",
    marginBottom: 6,
  },
  addressIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
    paddingVertical: 0,
  },
  addressHint: {
    fontSize: 12,
    color: "#A8A8A8",
    marginBottom: 20,
    paddingLeft: 4,
  },
  confirmTouchable: {
    borderRadius: 30,
    overflow: "hidden",
  },
  confirmButton: {
    height: 56,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});