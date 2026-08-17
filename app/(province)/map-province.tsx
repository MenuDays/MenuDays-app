import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import UserService from "../../services/user.service";
import LocationService from "../../services/location.service";
import MapLocationPicker, {
  MapLocationResult,
} from "../components/map/MapLocationPicker";
import { showLocationError, isNetworkError } from "../utils/locationErrors";

export default function MapScreen() {
  const [saving, setSaving] = useState(false);

  const { provinceId, provinceName, cityId, cityName, cityLatitude, cityLongitude } =
    useLocalSearchParams<{
      provinceId: string;
      provinceName: string;
      cityId: string;
      cityName: string;
      cityLatitude?: string;
      cityLongitude?: string;
    }>();

  const cityCoords =
    cityLatitude && cityLongitude
      ? { latitude: Number(cityLatitude), longitude: Number(cityLongitude) }
      : null;

  async function handleConfirm(result: MapLocationResult) {
    if (saving) return;
    setSaving(true);

    try {
      // 1) Guardar en el backend: esto es lo que realmente persiste
      //    la ciudad/provincia/ubicación del usuario en la base de datos.
      await UserService.updateProfile({
        provinceId: Number(provinceId),
        cityId: Number(cityId),
        latitude: result.latitude,
        longitude: result.longitude,
      });

      // 2) Guardar copia local (dirección textual, coordenadas, etc.)
      //    para lo que uses de LocationService en otras pantallas.
      await LocationService.saveUserLocation({
        province: { id: Number(provinceId), nombre: provinceName ?? "" },
        city: { id: Number(cityId), nombre: cityName ?? "" },
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
      });

      router.replace("/(home)/(tabs)");
    } catch (error) {
      console.error("Error completo:", error);

      if (error instanceof Error) {
        console.error("Mensaje:", error.message);
      }
      showLocationError(
        isNetworkError(error) ? "networkError" : "genericError",
        () => handleConfirm(result)
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <MapLocationPicker
        title="Tu ubicación"
        subtitle={`${cityName}, ${provinceName}`}
        confirmLabel={saving ? "Guardando..." : "Confirmar ubicación"}
        onBack={() => router.back()}
        onConfirm={handleConfirm}
        cityCoords={cityCoords}
      />
    </SafeAreaView>
  );
}