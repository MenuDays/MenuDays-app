import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import ProvinceHeader from "../components/province/ProvinceHeader";
import ProvinceSearch from "../components/province/ProvinceSearch";
import ContinueButton from "../components/province/ContinueButton";
import CityList from "../components/province/CityList";

import LocationService, { City } from "../../services/location.service";
import ProvinceService from "../../services/province.service";

export default function CityScreen() {
  const { provinceId, provinceName } = useLocalSearchParams<{
    provinceId: string;
    provinceName: string;
  }>();

  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    if (provinceId) {
      const data = LocationService.getCitiesByProvince(Number(provinceId));
      setCities(data);
    }
  }, [provinceId]);

  const filteredCities = useMemo(() => {
    if (!search.trim()) return cities;
    return cities.filter((city) =>
      city.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, cities]);

  async function handleContinue() {
    if (!selectedCity) return;
    await LocationService.saveSelectedCity(selectedCity);
    router.push({
      pathname: "/(province)/map-province",
      params: {
        provinceId,
        provinceName,
        cityId: selectedCity.id,
        cityName: selectedCity.name,
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProvinceHeader
        title={`¿En qué ciudad\nestás?`}
        subtitle={`Ciudades de ${provinceName}`}
      />

      <View style={styles.content}>
        <ProvinceSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Busca tu ciudad..."
        />

        <CityList
          cities={filteredCities}
          selectedCity={selectedCity}
          onSelectCity={setSelectedCity}
        />

        <ContinueButton
          disabled={!selectedCity}
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 18,
  },
});