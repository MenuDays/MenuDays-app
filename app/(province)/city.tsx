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
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";
import { showLocationError, isNetworkError } from "../utils/locationErrors";

export default function CityScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { provinceId, provinceName } = useLocalSearchParams<{
    provinceId: string;
    provinceName: string;
  }>();

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
    <SafeAreaView style={styles.container}>
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
    backgroundColor: colors.background,
    marginTop: -28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 18,
  },
});