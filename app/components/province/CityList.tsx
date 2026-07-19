import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import CityCard from "./CityCard";
import { City } from "../../../services/location.service";

interface CityListProps {
  cities: City[];
  selectedCity: City | null;
  onSelectCity: (city: City) => void;
}

export default function CityList({
  cities,
  selectedCity,
  onSelectCity,
}: CityListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ciudades disponibles</Text>
        <Text style={styles.counter}>{cities.length} ciudades</Text>
      </View>

      <FlatList
        data={cities}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CityCard
            city={item}
            selected={selectedCity?.id === item.id}
            onPress={() => onSelectCity(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  counter: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F5A800",
  },
  listContent: {
    paddingBottom: 20,
  },
});