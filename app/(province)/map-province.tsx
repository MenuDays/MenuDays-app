import React, { useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import UserService from "../../services/user.service";
import LocationService from "../../services/location.service";
import MapLocationPicker, {
  MapLocationResult,
} from "../components/map/MapLocationPicker";

export default function MapScreen() {
  const [saving, setSaving] = useState(false);

  const { provinceId, provinceName, cityId, cityName } =
    useLocalSearchParams<{
      provinceId: string;
      provinceName: string;
      cityId: string;
      cityName: string;
    }>();

  async function handleConfirm(result: MapLocationResult) {
    if (saving) return;
    setSaving(true);

    try {
      // 1) Guardar en el backend: esto es lo que realmente persiste
      //    la ciudad/provincia del usuario en la base de datos.
      await UserService.updateProfile({
        provinceId: Number(provinceId),
        cityId: Number(cityId),
      });

      // 2) Guardar copia local (coordenadas exactas del mapa, dirección
      //    textual, etc.) para lo que uses de LocationService en otras
      //    pantallas. El backend no tiene columnas para esto todavía,
      //    así que se mantiene solo local por ahora.
      await LocationService.saveUserLocation({
        province: { id: Number(provinceId), name: provinceName ?? "" },
        city: { id: Number(cityId), name: cityName ?? "" },
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
      });

      router.replace("/(home)");
    } catch (error) {
      console.error("Error guardando ubicación:", error);
      Alert.alert(
        "Error",
        "No se pudo guardar tu ubicación. Intenta de nuevo."
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
      />
    </SafeAreaView>
  );
}