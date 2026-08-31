import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { optimizedImageUri } from "../../../utils/imageUrl";
import StatusBadge, { StatusTone } from "./StatusBadge";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

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
  // "Sin stock" solo aplica a platos y menús (una promoción no tiene
  // este concepto) -- opcional por lo mismo que onToggleVisibility.
  onToggleStock?: () => void;
  isOutOfStock?: boolean;
  // "Duplicar" -- copia esta entidad para reutilizarla (solo menús por ahora).
  onDuplicate?: () => void;
  // Modo selección con checkbox (ej. "elegir los menús de hoy"). Cuando
  // `selectable` es true, la card entera funciona como checkbox y no
  // dispara onPress/onEdit/etc.
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
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
  onToggleStock,
  isOutOfStock = false,
  onDuplicate,
  selectable = false,
  selected = false,
  onToggleSelected,
}: EntityListCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.card, selectable && selected && styles.cardSelected]}
      activeOpacity={0.9}
      onPress={selectable ? onToggleSelected : onPress}
    >
      {selectable ? (
        <View style={[styles.checkbox, selected && styles.checkboxOn]}>
          {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>
      ) : null}
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image
            source={{ uri: optimizedImageUri(imageUri, "thumb") }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={120}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={22} color={colors.placeholder} />
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
            <Text style={[styles.highlight, isHidden && styles.highlightMuted]} numberOfLines={1}>
              {highlight}
            </Text>
          ) : (
            <View />
          )}

          <View style={styles.actions}>
            {selectable ? null : (
            <>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Ionicons name="pencil" size={16} color="#FB8C00" />
            </TouchableOpacity>
            {onDuplicate ? (
              <TouchableOpacity style={styles.actionButton} onPress={onDuplicate}>
                <Ionicons name="copy-outline" size={16} color={colors.placeholder} />
              </TouchableOpacity>
            ) : null}
            {onToggleStock ? (
              <TouchableOpacity style={styles.actionButton} onPress={onToggleStock}>
                <Ionicons
                  name={isOutOfStock ? "bag-remove" : "bag-check-outline"}
                  size={16}
                  color={isOutOfStock ? "#E53935" : colors.placeholder}
                />
              </TouchableOpacity>
            ) : null}
            {onToggleVisibility ? (
              <TouchableOpacity style={styles.actionButton} onPress={onToggleVisibility}>
                <Ionicons
                  name={isHidden ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color={colors.placeholder}
                />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Ionicons name="trash" size={16} color="#E53935" />
            </TouchableOpacity>
            </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: "#FB8C00",
  },
  checkbox: {
    alignSelf: "center",
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: "#FB8C00",
    borderColor: "#FB8C00",
  },
  imageWrap: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceSecondary,
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
    color: colors.text,
  },
  titleMuted: {
    color: colors.placeholder,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  highlight: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FB8C00",
  },
  highlightMuted: {
    color: colors.placeholder,
  },
  actions: {
    flexShrink: 0,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
});