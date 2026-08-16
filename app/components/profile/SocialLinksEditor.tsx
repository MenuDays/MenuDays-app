import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantSocialLink, RedSocial } from "../../../services/restaurant.service";
import { useTheme } from "../../../contexts/ThemeContext";

const NETWORK_ICONS: Record<RedSocial, string> = {
  instagram: "logo-instagram",
  facebook: "logo-facebook",
  tiktok: "logo-tiktok",
  otro: "link-outline",
};

const NETWORK_OPTIONS: RedSocial[] = ["instagram", "facebook", "tiktok", "otro"];

export default function SocialLinksEditor({
  links,
  onAdd,
  onRemove,
}: {
  links: RestaurantSocialLink[];
  onAdd: (plataforma: RedSocial, url: string) => void;
  onRemove: (id: number) => void;
}) {
  const { colors } = useTheme();
  const [selectedNetwork, setSelectedNetwork] = useState<RedSocial>("instagram");
  const [newUrl, setNewUrl] = useState("");

  function handleAdd() {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    onAdd(selectedNetwork, trimmed);
    setNewUrl("");
  }

  return (
    <View>
      {links.map((link) => (
        <View key={link.id} style={[styles.row, { borderBottomColor: colors.divider }]}>
          <Ionicons name={NETWORK_ICONS[link.plataforma] as any} size={18} color={colors.primary} style={styles.icon} />
          <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>{link.url}</Text>
          <TouchableOpacity onPress={() => onRemove(link.id)} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={colors.border} />
          </TouchableOpacity>
        </View>
      ))}

      {links.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.placeholder }]}>
          Todavía no agregaste redes sociales
        </Text>
      )}

      <View style={styles.networkPicker}>
        {NETWORK_OPTIONS.map((net) => (
          <TouchableOpacity
            key={net}
            style={[
              styles.networkChip,
              { backgroundColor: colors.surfaceSecondary },
              selectedNetwork === net && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedNetwork(net)}
          >
            <Ionicons
              name={NETWORK_ICONS[net] as any}
              size={16}
              color={selectedNetwork === net ? "#FFFFFF" : colors.placeholder}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={[
            styles.addInput,
            { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground },
          ]}
          value={newUrl}
          onChangeText={setNewUrl}
          placeholder="https://..."
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          keyboardType="url"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          disabled={!newUrl.trim()}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    paddingVertical: 12,
  },
  networkPicker: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  networkChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
