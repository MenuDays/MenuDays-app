import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
// SafeMapView vive FUERA de app/ (en components/map/, no
// app/components/map/) a propósito: el escaneo de rutas de Expo Router
// para el bundle web requiere cada .tsx bajo app/ por su nombre de
// archivo literal (sin pasar por la resolución de extensión .web.tsx de
// Metro), así que si este wrapper viviera adentro de app/, su variante
// nativa (que importa react-native-maps de verdad) igual se intentaría
// bundlear para web y rompería el build -- ver components/map/SafeMapView.tsx.
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "../../../components/map/SafeMapView";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../common/AppAlert";
import ErrorBoundary from "../common/ErrorBoundary";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Los 2 usos de este componente (map-province.tsx,
  // select-restaurant-location.tsx) envuelven la pantalla en un
  // SafeAreaView con edges={["top"]} nada más -- el inset de ABAJO
  // (barra de gestos/botones de Android) nunca se aplicaba, así que el
  // botón "Confirmar ubicación" quedaba pegado o tapado por esa barra.
  // Se resuelve acá adentro (no en cada pantalla que lo usa) para que
  // funcione sin importar desde dónde se lo llame.
  const insets = useSafeAreaInsets();
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
      "¿Cómo quieres fijar tu ubicación?",
      "Puedes usar tu ubicación actual al instante, o elegirla tú mismo tocando el mapa o escribiendo la dirección.",
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

  // Fuente PRIMARIA: OpenStreetMap Nominatim (reverse geocoding),
  // gratis y sin API key -- el geocoder nativo del teléfono
  // (Location.reverseGeocodeAsync) daba resultados pobres/vacíos muy
  // seguido (sobre todo Android fuera de zonas muy urbanas), y la app
  // no tiene una API key de Google Maps sin restricción de Android para
  // pegarle directo a la Geocoding API de Google. Nominatim da mucho
  // más detalle (calle, barrio, ciudad) de forma consistente.
  //
  // Prioridad: nombre de punto de interés (plaza, local, monumento) >
  // calle + altura > barrio/sector > ciudad. displayName (la dirección
  // completa larguísima que arma Nominatim) queda como último recurso
  // antes de darse por vencido.
  async function resolveAddressFromNominatim(lat: number, lng: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;
    const response = await fetch(url, {
      headers: { "User-Agent": "MenuDaysApp/1.0 (contacto@menudays.com)" },
    });
    if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`);

    const data = await response.json();
    const addr = data?.address ?? {};
    const poiName: string | undefined = data?.name || addr.amenity || addr.shop || addr.tourism || addr.building;
    const streetLine = [addr.road, addr.house_number].filter(Boolean).join(" ");
    const area = [addr.neighbourhood || addr.suburb || addr.quarter, addr.city_district, addr.city || addr.town || addr.village]
      .filter(Boolean)
      .join(", ");

    return poiName || streetLine || area || data?.display_name || null;
  }

  // Fallback: geocoder nativo del teléfono, por si Nominatim falla (sin
  // red, rate limit, etc.) -- mismo criterio de prioridad que antes.
  async function resolveAddressFromNative(lat: number, lng: number, attempt = 1): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length === 0) return null;

      const r = results[0];
      const streetLine = [r.street, r.streetNumber].filter(Boolean).join(" ");
      const fallback = [r.district, r.subregion, r.city, r.region].filter(Boolean).join(", ");
      return r.name || streetLine || fallback || null;
    } catch (e) {
      console.log(`Error en geocoding nativo (intento ${attempt}):`, e);
      if (attempt < 2) return resolveAddressFromNative(lat, lng, attempt + 1);
      return null;
    }
  }

  async function resolveAddress(lat: number, lng: number): Promise<string | null> {
    try {
      const fromNominatim = await resolveAddressFromNominatim(lat, lng);
      if (fromNominatim) return fromNominatim;
    } catch (e) {
      console.log("Error en Nominatim, cae al geocoder nativo:", e);
    }
    return resolveAddressFromNative(lat, lng);
  }

  // El pin en el mapa (marker) es lo que de verdad importa y ya queda
  // puesto apenas se toca -- esto solo resuelve el TEXTO de la
  // dirección para no dejarlo vacío. Si NINGUNA de las dos fuentes
  // (Nominatim + geocoder nativo) pudo resolver nada -- caso extremo,
  // sin red por ejemplo -- se cae a un texto genérico editable, NUNCA a
  // las coordenadas crudas: un usuario común no entiende
  // "-1.83120, -78.18340" como ubicación.
  async function reverseGeocode(lat: number, lng: number) {
    const resolved = await resolveAddress(lat, lng);
    setAddress(resolved ?? "Ubicación seleccionada en el mapa");
  }

  async function handleMapPress(e: any) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    setAddress(""); // feedback inmediato: se está resolviendo la dirección nueva
    await reverseGeocode(latitude, longitude);
  }

  // Antes, si el permiso de ubicación ya había sido denegado una vez,
  // volver a tocar "Usar mi ubicación actual" mostraba el mismo cartel de
  // "Permiso denegado" para siempre sin ninguna salida real. Ahora, si
  // quedó denegado de forma permanente (canAskAgain: false), se ofrece ir
  // directo a Ajustes para habilitarlo -- así se captura al instante la
  // próxima vez, tal como pide el flujo de "activar ubicación del
  // teléfono".
  async function ensureLocationPermission(): Promise<boolean> {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return true;

    if (!current.canAskAgain) {
      AppAlert.alert(
        "Activa tu ubicación",
        "Para capturarla al instante, habilita el permiso de ubicación en Ajustes. Mientras tanto, puedes elegirla tocando el mapa o escribiendo la dirección.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Abrir Ajustes", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    const requested = await Location.requestForegroundPermissionsAsync();
    return requested.granted;
  }

  async function handleMyLocation() {
    setLocating(true);
    try {
      const hasPermission = await ensureLocationPermission();
      if (!hasPermission) return;

      // Si el GPS del teléfono está apagado (no el permiso de la app, el
      // servicio de ubicación del sistema), Android puede ofrecer
      // activarlo con su propio diálogo nativo sin salir de la app --
      // así se captura la ubicación al instante en el mismo toque.
      if (Platform.OS === "android") {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          try {
            await Location.enableNetworkProviderAsync();
          } catch {
            // El usuario cerró el diálogo sin activar la ubicación: se
            // queda como estaba, sin alertas -- puede seguir eligiendo
            // el punto a mano en el mapa.
            return;
          }
        }
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
      console.log("Error obteniendo ubicación:", e);
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
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        ) : (
          // Si el mapa nativo no arranca en algún Android, se puede seguir
          // fijando la ubicación a mano (input de dirección) o con el GPS
          // ("Usar mi ubicación actual") -- la pantalla no queda inservible.
          <ErrorBoundary
            fallback={
              <View style={styles.loadingContainer}>
                <Ionicons name="map-outline" size={28} color={colors.textSecondary} />
                <Text style={styles.loadingText}>
                  No se pudo cargar el mapa. Escribí la dirección abajo o usá tu ubicación actual.
                </Text>
              </View>
            }
          >
          <MapView
            ref={mapRef}
            style={styles.map}
            // Explícito en vez de dejar que RN Maps infiera el provider:
            // en Android SIEMPRE es Google Maps igual (no hay otra opción
            // ahí), pero sin esto algunos dispositivos/OEM pueden
            // comportarse distinto. En iOS, al no pasar PROVIDER_GOOGLE,
            // usa Apple Maps nativo (no necesita API key ahí).
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            initialRegion={region}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker coordinate={marker} pinColor={colors.primary} />
          </MapView>
          </ErrorBoundary>
        )}

        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleMyLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        <View style={styles.hint}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.hintText}>
            Toca el mapa para ajustar tu ubicación
          </Text>
        </View>
      </View>

      {/* Panel inferior -- KeyboardStickyView (react-native-keyboard-controller)
          en vez del KeyboardAvoidingView nativo de RN: éste último dependía
          de android:windowSoftInputMode="resize" para funcionar en Android,
          que en un build standalone con edgeToEdgeEnabled (ver app.json) no
          siempre resizea la ventana como se espera, y el panel terminaba
          tapado por el teclado. KeyboardStickyView sigue el alto real del
          teclado nativo (vía reanimated) sin depender de eso, y funciona
          igual en ambas plataformas. */}
      <KeyboardStickyView style={[styles.bottomPanel, { paddingBottom: 28 + insets.bottom }]}>
        <Text style={styles.addressLabel}>Dirección aproximada</Text>
        <View style={styles.addressInput}>
          <Ionicons
            name="location-outline"
            size={20}
            color={colors.primary}
            style={styles.addressIcon}
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Ej: Av. Amazonas N34-183"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            returnKeyType="done"
            selectionColor={colors.primary}
          />
          {address.length > 0 && (
            <TouchableOpacity onPress={() => setAddress("")}>
              <Ionicons name="close-circle" size={18} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.addressHint}>
          Puedes editar la dirección si no es exacta
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
      </KeyboardStickyView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
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
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  myLocationButton: {
    position: "absolute",
    right: 16,
    bottom: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomPanel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  addressInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: colors.inputBackground,
    marginBottom: 6,
  },
  addressIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  addressHint: {
    fontSize: 12,
    color: colors.placeholder,
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