import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { optimizedImageUri } from "../../../utils/imageUrl";

export interface ImageViewerItem {
  uri: string;
  label?: string;
}

interface ImageViewerModalProps {
  visible: boolean;
  images: ImageViewerItem[];
  /** Índice inicial a mostrar (por si se tocó una miniatura específica). */
  initialIndex?: number;
  onClose: () => void;
}

// Visor de imagen a pantalla completa, reutilizable en toda la app: se
// abre al tocar una miniatura (foto de perfil, documento, portada, etc.).
// Sin librerías nuevas -- el pinch-to-zoom usa el `maximumZoomScale` nativo
// de ScrollView (soportado en iOS y Android), y el swipe entre varias
// imágenes usa el mismo patrón de FlatList paginado que ya existía en
// restaurant-gallery.tsx.
export default function ImageViewerModal({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImageViewerModalProps) {
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  if (!visible || images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.header}>
            {images.length > 1 ? (
              <Text style={styles.counter}>
                {activeIndex + 1} / {images.length}
              </Text>
            ) : (
              <View />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(index);
            }}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            renderItem={({ item }) => (
              <View style={{ width, height }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.zoomContent}
                  maximumZoomScale={4}
                  minimumZoomScale={1}
                  centerContent
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={{ uri: optimizedImageUri(item.uri, "full") }}
                    style={[styles.image, { width, height: height * 0.75 }]}
                    contentFit="contain"
                    allowDownscaling={false}
                    cachePolicy="memory-disk"
                    transition={120}
                  />
                </ScrollView>
              </View>
            )}
          />

          {images[activeIndex]?.label ? (
            <Text style={styles.label}>{images[activeIndex].label}</Text>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  counter: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    alignSelf: "center",
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingBottom: 12,
  },
});
