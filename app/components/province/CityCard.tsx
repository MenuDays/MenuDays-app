import React, { useMemo } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { City } from "../../../services/location.service";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface CityCardProps {
  city: City;
  selected: boolean;
  onPress: () => void;
}

export default function CityCard({ city, selected, onPress }: CityCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.leftContent}>
        <Ionicons
          name="location-outline"
          size={18}
          color={selected ? colors.primary : colors.placeholder}
          style={styles.icon}
        />
        <Text
          style={[styles.title, selected && styles.titleSelected]}
          numberOfLines={1}
        >
          {city.nombre}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={22}
        color={selected ? colors.primary : colors.placeholder}
      />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    height: 58,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
  },
  leftContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    color: colors.text,
  },
  titleSelected: {
    color: colors.primaryDark,
  },
});