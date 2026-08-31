import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";
import CityList from "../components/province/CityList";
import ContinueButton from "../components/province/ContinueButton";
import ProvinceHeader from "../components/province/ProvinceHeader";
import ProvinceSearch from "../components/province/ProvinceSearch";

import LocationService, { City } from "../../services/location.service";
import ProvinceCityPickerBridge from "../../services/provinceCityPicker.bridge";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";
import { showLocationError, isNetworkError } from "../utils/locationErrors";

export default function CityScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { provinceId, provinceName, picker } = useLocalSearchParams<{
    provinceId: string;
    provinceName: string;
    picker?: string;
  }>();
  const isPickerMode = picker === "1";

  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
  async function loadCities() {
    if (!provinceId) return;

    try {
      const data = await LocationService.getCitiesByProvince(
        Number(provinceId)
      );

      setCities(data);
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
      showLocationError(
        isNetworkError(error) ? "networkError" : "genericError",
        loadCities
      );
    }
  }

  loadCities();
}, [provinceId]);

  const filteredCities = useMemo(() => {
    if (!search.trim()) return cities;
    return cities.filter((city) =>
      city.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, cities]);

  async function handleContinue() {
    if (!selectedCity) {
      showLocationError("missingCity");
      return;
    }

    if (isPickerMode) {
      ProvinceCityPickerBridge.set({
        province: { id: Number(provinceId), nombre: provinceName ?? "" },
        city: {
          id: Number(selectedCity.id),
          nombre: selectedCity.nombre,
          latitud: selectedCity.latitud ?? null,
          longitud: selectedCity.longitud ?? null,
        },
      });
      // Un solo back: index.tsx usó router.replace en modo selector, así
      // que esta pantalla ocupa su lugar en la pila -- volver un paso
      // alcanza para llegar directo a quien abrió el selector.
      router.back();
      return;
    }

    await LocationService.saveSelectedCity(selectedCity);
    router.push({
      pathname: "/(province)/map-province",
      params: {
        provinceId,
        provinceName,
        cityId: selectedCity.id,
        cityName: selectedCity.nombre,
        // Coordenadas del centro de la ciudad (tabla ciudades),
        // para centrar el mapa ahí en vez de en todo Ecuador.
        cityLatitude: selectedCity.latitud != null ? String(selectedCity.latitud) : "",
        cityLongitude: selectedCity.longitud != null ? String(selectedCity.longitud) : "",
      },
    });
  }

  return (
    // El borde inferior lo maneja ContinueButton con el inset real del
    // dispositivo, no el SafeAreaView (que en edge-to-edge + Android viejo
    // no siempre aplica bien el bottom) -> por eso acá solo top/lados.
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingScreen>
      <CityList
        cities={filteredCities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        ListHeaderComponent={
          <>
            <ProvinceHeader
              title={`¿En qué cantón\nestás?`}
              subtitle={`Cantones de ${provinceName}`}
            />
            <View style={styles.searchWrap}>
              <ProvinceSearch
                value={search}
                onChangeText={setSearch}
                placeholder="Busca tu cantón..."
              />
            </View>
          </>
        }
      />

      <ContinueButton
        disabled={!selectedCity}
        onPress={handleContinue}
      />
      </KeyboardAvoidingScreen>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    backgroundColor: colors.surface,
    marginTop: -28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 18,
  },
});