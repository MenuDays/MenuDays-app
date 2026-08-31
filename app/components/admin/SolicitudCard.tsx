import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantApplicationSummary } from "../../../services/restaurantApplicationsAdmin.service";
import { optimizedImageUri } from "../../../utils/imageUrl";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface SolicitudCardProps {
  application: RestaurantApplicationSummary;
  onPress: () => void;
}

export default function SolicitudCard({
  application,
  onPress,
}: SolicitudCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {application.logoUrl ? (
        <Image
          source={{ uri: optimizedImageUri(application.logoUrl, "thumb") }}
          style={styles.avatarImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={120}
        />
      ) : (
        <View
          style={[styles.avatar, { backgroundColor: application.avatarColor }]}
        >
          <Ionicons
            name={application.avatarIcon as any}
            size={20}
            color="#FFFFFF"
          />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{application.name}</Text>
        <Text style={styles.date}>{application.submittedAt}</Text>
      </View>

      <View style={styles.chevronCircle}>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3E2723",
    alignItems: "center",
    justifyContent: "center",
  },
});