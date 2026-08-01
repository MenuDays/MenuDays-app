import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantSocialLink, RedSocial } from "../../../services/restaurant.service";

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
        <View key={link.id} style={styles.row}>
          <Ionicons name={NETWORK_ICONS[link.plataforma] as any} size={18} color="#F5A800" style={styles.icon} />
          <Text style={styles.value} numberOfLines={1}>{link.url}</Text>
          <TouchableOpacity onPress={() => onRemove(link.id)} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#E0E0E0" />
          </TouchableOpacity>
        </View>
      ))}

      {links.length === 0 && (
        <Text style={styles.emptyText}>Todavía no agregaste redes sociales</Text>
      )}

      <View style={styles.networkPicker}>
        {NETWORK_OPTIONS.map((net) => (
          <TouchableOpacity
            key={net}
            style={[styles.networkChip, selectedNetwork === net && styles.networkChipActive]}
            onPress={() => setSelectedNetwork(net)}
          >
            <Ionicons
              name={NETWORK_ICONS[net] as any}
              size={16}
              color={selectedNetwork === net ? "#FFFFFF" : "#9E9E9E"}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={newUrl}
          onChangeText={setNewUrl}
          placeholder="https://..."
          placeholderTextColor="#BDBDBD"
          autoCapitalize="none"
          keyboardType="url"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={!newUrl.trim()}>
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
    borderBottomColor: "#F5F5F5",
  },
  icon: {
    marginRight: 10,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  emptyText: {
    fontSize: 13,
    color: "#9E9E9E",
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
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  networkChipActive: {
    backgroundColor: "#F5A800",
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
    borderColor: "#E7E7E7",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F5A800",
    alignItems: "center",
    justifyContent: "center",
  },
});