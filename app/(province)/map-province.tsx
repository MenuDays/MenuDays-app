import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import LocationService from "../../services/location.service";
import MapLocationPicker, {
  MapLocationResult,
} from "../components/map/MapLocationPicker";

export default function MapScreen() {
  const { provinceId, provinceName, cityId, cityName } =
    useLocalSearchParams<{
      provinceId: string;
      provinceName: string;
      cityId: string;
      cityName: string;
    }>();

  async function handleConfirm(result: MapLocationResult) {
    const userLocation = {
      province: { id: Number(provinceId), name: provinceName ?? "" },
      city: { id: Number(cityId), name: cityName ?? "" },
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
    };
    await LocationService.saveUserLocation(userLocation);
    // TODO: reemplazar por llamada real cuando el backend esté listo
    // POST /api/user/location
    console.log("[MOCK] Enviaría al backend:", userLocation);
    router.replace("/(home)");
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <MapLocationPicker
        title="Tu ubicación"
        subtitle={`${cityName}, ${provinceName}`}
        confirmLabel="Confirmar ubicación"
        onBack={() => router.back()}
        onConfirm={handleConfirm}
      />
    </SafeAreaView>
  );
}