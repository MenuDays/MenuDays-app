import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge, { StatusTone } from "./StatusBadge";

interface EntityListCardProps {
  imageUri: string | null;
  title: string;
  // Línea secundaria opcional -- descripción del menú, categoría del
  // plato, etc. Se corta a 1 línea.
  subtitle?: string;
  // Dato destacado a la derecha/abajo -- "$4.50" para un menú/plato,
  // una fecha para una promoción. Texto libre para no atarlo a moneda.
  highlight?: string;
  statusLabel: string;
  statusTone: StatusTone;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  // "Ocultar" no aplica a todos los módulos de la misma forma (ej. una
  // promoción vencida no se "oculta"), así que es opcional -- si no se
  // pasa, ese botón no se muestra.
  onToggleVisibility?: () => void;
  isHidden?: boolean;
}

export default function EntityListCard({
  imageUri,
  title,
  subtitle,
  highlight,
  statusLabel,
  statusTone,
  onPress,
  onEdit,
  onDelete,
  onToggleVisibility,
  isHidden = false,
}: EntityListCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={22} color="#C9C9C9" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.title, isHidden && styles.titleMuted]} numberOfLines={1}>
            {title}
          </Text>
          <StatusBadge label={statusLabel} tone={statusTone} />
        </View>

        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          {highlight ? (
            <Text style={[styles.highlight, isHidden && styles.highlightMuted]}>
              {highlight}
            </Text>
          ) : (
            <View />
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Ionicons name="pencil" size={16} color="#FB8C00" />
            </TouchableOpacity>
            {onToggleVisibility ? (
              <TouchableOpacity style={styles.actionButton} onPress={onToggleVisibility}>
                <Ionicons
                  name={isHidden ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color="#9E9E9E"
                />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Ionicons name="trash" size={16} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  imageWrap: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  titleMuted: {
    color: "#B0B0B0",
  },
  subtitle: {
    fontSize: 12.5,
    color: "#9E9E9E",
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  highlight: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FB8C00",
  },
  highlightMuted: {
    color: "#C9C9C9",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
});