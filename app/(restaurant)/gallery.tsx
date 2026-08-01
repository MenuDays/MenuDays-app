import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Text, ActivityIndicator, TouchableOpacity, Image, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import GalleryService, { GalleryImage } from "../../services/gallery.service";
import DishService, { Dish } from "../../services/dish.service";
import { AppAlert } from "../components/common/AppAlert";

type Tab = "restaurant" | "dishes";

export default function GalleryScreen() {
  const [tab, setTab] = useState<Tab>("restaurant");

  // Tab "Restaurante"
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Tab "Platos"
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  async function loadGallery() {
    try {
      const data = await GalleryService.getAll();
      setImages(data);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo cargar la galería.");
    } finally {
      setLoadingImages(false);
      setRefreshing(false);
    }
  }

  async function loadDishes() {
    try {
      const data = await DishService.getAll();
      setDishes(data);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudieron cargar los platos.");
    } finally {
      setLoadingDishes(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadGallery();
      loadDishes();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    if (tab === "restaurant") {
      loadGallery();
    } else {
      loadDishes();
    }
  }

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      AppAlert.alert("Permiso necesario", "Necesitamos acceso a tus fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const uploaded = await GalleryService.upload(result.assets[0].uri);
      setImages((prev) => [uploaded, ...prev]);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  function handleOpenImageOptions(image: GalleryImage) {
    const buttons = [
      ...(image.es_portada
        ? []
        : [
            {
              text: "Usar como portada",
              onPress: () => handleSetCover(image.id),
            },
          ]),
      {
        text: "Eliminar",
        style: "destructive" as const,
        onPress: () => handleDelete(image.id),
      },
      { text: "Cancelar", style: "cancel" as const },
    ];
    AppAlert.alert("Foto de la galería", undefined, buttons);
  }

  async function handleSetCover(id: string) {
    try {
      await GalleryService.setCover(id);
      setImages((prev) => prev.map((img) => ({ ...img, es_portada: img.id === id })));
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar la portada.");
    }
  }

  function handleDelete(id: string) {
    AppAlert.alert("Eliminar foto", "¿Seguro que querés eliminar esta foto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await GalleryService.remove(id);
            setImages((prev) => prev.filter((img) => img.id !== id));
          } catch (e: any) {
            AppAlert.alert("Error", e.message || "No se pudo eliminar la foto.");
          }
        },
      },
    ]);
  }

  function handleOpenDish(dish: Dish) {
    // Misma ruta que usa platos.tsx para editar un plato existente.
    router.push(`/(restaurant)/platos/form?id=${dish.id}`);
  }

  const isRestaurantTab = tab === "restaurant";
  const loading = isRestaurantTab ? loadingImages : loadingDishes;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Galería"
        rightIcon={isRestaurantTab && !uploading ? "add" : undefined}
        onRightPress={isRestaurantTab ? handleAddPhoto : undefined}
      />

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, isRestaurantTab && styles.tabButtonActive]}
          onPress={() => setTab("restaurant")}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, isRestaurantTab && styles.tabTextActive]}>Restaurante</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, !isRestaurantTab && styles.tabButtonActive]}
          onPress={() => setTab("dishes")}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, !isRestaurantTab && styles.tabTextActive]}>Platos</Text>
        </TouchableOpacity>
      </View>

      {isRestaurantTab && uploading ? (
        <View style={styles.uploadingBar}>
          <ActivityIndicator size="small" color="#FB8C00" />
          <Text style={styles.uploadingText}>Subiendo foto...</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={styles.loader} />
      ) : isRestaurantTab ? (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="images-outline" size={36} color="#D9D9D9" />
              <Text style={styles.emptyText}>
                Todavía no subiste fotos. Tocá + para agregar la primera.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cell}
              activeOpacity={0.85}
              onPress={() => handleOpenImageOptions(item)}
            >
              <Image source={{ uri: item.url }} style={styles.cellImage} />
              {item.es_portada ? (
                <View style={styles.coverBadge}>
                  <Ionicons name="star" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="restaurant-outline" size={36} color="#D9D9D9" />
              <Text style={styles.emptyText}>
                Todavía no cargaste platos.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cell}
              activeOpacity={0.85}
              onPress={() => handleOpenDish(item)}
            >
              {item.plato_imagenes[0]?.url ? (
                <Image source={{ uri: item.plato_imagenes[0].url }} style={styles.cellImage} />
              ) : (
                <View style={[styles.cellImage, styles.cellImagePlaceholder]}>
                  <Ionicons name="image-outline" size={22} color="#D9D9D9" />
                </View>
              )}
              <View style={styles.dishNameBadge}>
                <Text style={styles.dishNameText} numberOfLines={1}>
                  {item.nombre}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <RestaurantBottomNav />
    </View>
  );
}

const GAP = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loader: {
    marginTop: 40,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  tabButtonActive: {
    backgroundColor: "#FB8C00",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9E9E9E",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  uploadingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
  },
  uploadingText: {
    fontSize: 13,
    color: "#9E9E9E",
    fontWeight: "600",
  },
  grid: {
    padding: GAP,
    paddingBottom: 120,
  },
  row: {
    gap: GAP,
  },
  cell: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: GAP / 2,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  cellImage: {
    width: "100%",
    height: "100%",
  },
  cellImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FB8C00",
    alignItems: "center",
    justifyContent: "center",
  },
  dishNameBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dishNameText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 13,
  },
});