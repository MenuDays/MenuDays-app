import React, { useMemo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CityCard from "./CityCard";
import { City } from "../../../services/location.service";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface CityListProps {
  cities: City[];
  selectedCity: City | null;
  onSelectCity: (city: City) => void;
  /** Contenido que va ARRIBA de la lista (imagen + buscador) pero
   * scrollea junto con ella -- ver mismo patrón en ProvinceList. */
  ListHeaderComponent?: React.ReactElement | null;
}

export default function CityList({
  cities,
  selectedCity,
  onSelectCity,
  ListHeaderComponent,
}: CityListProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <FlatList
      style={styles.container}
      data={cities}
      keyExtractor={(item) => item.id.toString()}
      showsVerticalScrollIndicator={false}
      // El último cantón siempre queda por encima de la barra del sistema:
      // se suma el inset inferior real del dispositivo al padding de la lista.
      contentContainerStyle={[styles.listContent, { paddingBottom: 20 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          <View style={styles.header}>
            <Text style={styles.title}>Cantones disponibles</Text>
            <Text style={styles.counter}>{cities.length} cantones</Text>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <CityCard
            city={item}
            selected={selectedCity?.id === item.id}
            onPress={() => onSelectCity(item)}
          />
        </View>
      )}
    />
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 14,
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  counter: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  cardWrap: {
    paddingHorizontal: 18,
  },
  listContent: {
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
});