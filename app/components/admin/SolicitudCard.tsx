import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantApplicationSummary } from "../../../services/restaurantApplicationsAdmin.service";

interface SolicitudCardProps {
  application: RestaurantApplicationSummary;
  onPress: () => void;
}

export default function SolicitudCard({
  application,
  onPress,
}: SolicitudCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {application.logoUrl ? (
        <Image source={{ uri: application.logoUrl }} style={styles.avatarImage} />
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

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
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
    color: "#1A1A1A",
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: "#9E9E9E",
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