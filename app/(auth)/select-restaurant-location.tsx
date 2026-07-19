import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import RestaurantLocationPickerBridge from "../../services/restaurantLocationPicker.bridge";
import MapLocationPicker, {
  MapLocationResult,
} from "../components/map/MapLocationPicker";

export default function SelectRestaurantLocationScreen() {
  // Opcional: si ya venía con nombre de ciudad/provincia elegidos en el
  // formulario, los mostramos como subtítulo de contexto.
  const { cityName, provinceName } = useLocalSearchParams<{
    cityName?: string;
    provinceName?: string;
  }>();

  async function handleConfirm(result: MapLocationResult) {
    RestaurantLocationPickerBridge.set(result);
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <MapLocationPicker
        title="Ubicación del restaurante"
        subtitle={
          cityName && provinceName ? `${cityName}, ${provinceName}` : undefined
        }
        confirmLabel="Usar esta ubicación"
        onBack={() => router.back()}
        onConfirm={handleConfirm}
      />
    </SafeAreaView>
  );
}