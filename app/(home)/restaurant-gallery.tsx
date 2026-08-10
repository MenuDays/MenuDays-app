import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import RestaurantService, { PublicGalleryImage } from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";
import { EmptyState } from "../components/common/EmptyState";

// La galería completa ya viene incluida en RestaurantPublicDetail.galeria
// (GET /restaurants/:id), así que no hace falta ningún endpoint nuevo acá
// -- sólo se vuelve a pedir el detalle público para no tener que pasar
// todo el array de fotos por route params.
const { width } = Dimensions.get("window");
const GAP = 8;
const NUM_COLUMNS = 3;
const THUMB_SIZE = (width - 20 * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function RestaurantGalleryScreen() {
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>();

  const [images, setImages] = useState<PublicGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    // Mismo caso: sin resetear, al entrar a la galería de otro
    // restaurante se veían por un instante (o directamente quedaban,
    // si el fetch nuevo fallaba) las fotos del restaurante anterior.
    setLoading(true);
    setImages([]);
    setSelectedIndex(null);
    RestaurantService.getPublicDetail(id)
      .then((detail) => setImages([...detail.galeria].sort((a, b) => a.orden - b.orden)))
      .catch((e: any) => AppAlert.alert("Error", e.message || "No se pudo cargar la galería."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Galería{nombre ? ` · ${nombre}` : ""}
        </Text>
        <View style={styles.roundButton} />
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => String(item.id)}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={styles.grid}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => setSelectedIndex(index)} activeOpacity={0.85}>
              <Image source={{ uri: item.url }} style={styles.thumb} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              mascot={require("../../assets/images/nene-brazos-cruzados.png")}
              text="Este restaurante todavía no cargó fotos."
            />
          }
        />
      )}

      <Modal visible={selectedIndex !== null} transparent animationType="fade" onRequestClose={() => setSelectedIndex(null)}>
        <View style={styles.viewerBackdrop}>
          <SafeAreaView style={styles.viewerHeader} edges={["top"]}>
            <TouchableOpacity style={styles.viewerCloseButton} onPress={() => setSelectedIndex(null)}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {selectedIndex !== null && (
            <FlatList
              data={images}
              keyExtractor={(item) => String(item.id)}
              horizontal
              pagingEnabled
              initialScrollIndex={selectedIndex}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={{ width, alignItems: "center", justifyContent: "center" }}>
                  <Image source={{ uri: item.url }} style={styles.fullImage} resizeMode="contain" />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  roundButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "800", color: "#1A1A1A" },

  grid: { padding: 20, gap: GAP },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 10, marginBottom: GAP, backgroundColor: "#F5F5F5" },

  emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 50 },
  emptyText: { fontSize: 13, color: "#9E9E9E", textAlign: "center", paddingHorizontal: 30 },

  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  viewerHeader: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16 },
  viewerCloseButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  fullImage: { width: width - 32, height: "80%" },
});