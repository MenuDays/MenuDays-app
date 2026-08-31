import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../common/AppAlert";
import { pickImageFromLibrary } from "../../../utils/imagePicker";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";
import {
  getFeaturedMenuPhotoPresets,
  getMenuPhotoPresetGroups,
  MenuPhotoPreset,
} from "../../../constants/menuPhotoPresets";
import { resolveMenuPhotoPresetUri } from "../../../utils/menuPhotoPreset";

interface FormImagePickerProps {
  imageUri: string | null;
  // `null` = el restaurante quitó la foto (botón "Eliminar").
  onChange: (uri: string | null) => void;
  label?: string;
  aspect?: [number, number];
  // Si es true, además de subir una foto propia se ofrecen fotos de
  // EJEMPLO (assets/menu-presets) -- 5 destacadas + un "Ver más" con
  // todas agrupadas por categoría. Pensado para que una card de menú no
  // quede vacía si el restaurante no tiene foto propia.
  allowPresets?: boolean;
  // Categoría (nombre) elegida en el form -- si coincide con la de las
  // fotos de ejemplo, ese grupo se muestra primero en "Ver más".
  presetCategory?: string | null;
}

export default function FormImagePicker({
  imageUri,
  onChange,
  label = "Subir foto",
  aspect = [4, 3],
  allowPresets = false,
  presetCategory = null,
}: FormImagePickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const featured = useMemo(() => getFeaturedMenuPhotoPresets(), []);
  const groups = useMemo(
    () => getMenuPhotoPresetGroups(presetCategory),
    [presetCategory]
  );

  async function pickImage() {
    // Helper a prueba de fallos: maneja permisos (incluido "no volver a
    // preguntar" -> Ajustes) y cualquier error del selector nativo sin
    // dejar una promesa colgada ni el botón muerto.
    //
    // `allowsEditing: true` -> el usuario RECORTA / ACOMODA / hace ZOOM y
    // CONFIRMA el encuadre antes de que la foto entre al formulario, con
    // la relación de aspecto que usa MenuDays para esa card (`aspect`).
    // Se usa la herramienta de recorte NATIVA del sistema a propósito:
    // es la opción estable y compatible en toda la gama de Android
    // (incluidos equipos viejos), sin depender de librerías de gestos.
    const picked = await pickImageFromLibrary({
      aspect,
      allowsEditing: true,
    });

    if (picked.ok && picked.asset) {
      onChange(picked.asset.uri);
    }
  }

  function removeImage() {
    onChange(null);
  }

  async function selectPreset(preset: MenuPhotoPreset) {
    if (resolvingId) return;
    setResolvingId(preset.id);
    try {
      const uri = await resolveMenuPhotoPresetUri(preset.id);
      if (uri) {
        onChange(uri);
        setPresetModalOpen(false);
      } else {
        AppAlert.alert("Error", "No se pudo usar esa foto de ejemplo.");
      }
    } catch {
      AppAlert.alert("Error", "No se pudo usar esa foto de ejemplo.");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        {imageUri ? (
          <>
            <TouchableOpacity
              style={styles.image}
              onPress={pickImage}
              activeOpacity={0.85}
              accessibilityLabel="Cambiar o recortar la foto"
            >
              <Image source={{ uri: imageUri }} style={styles.image} />
            </TouchableOpacity>
            {/* Quitar rápido -- botón claro, no un ícono perdido sobre la
                foto. Al tocarlo la foto desaparece y el estado vuelve a
                "sin foto" (onChange(null)). */}
            <TouchableOpacity
              style={styles.removeBadge}
              onPress={removeImage}
              activeOpacity={0.85}
              hitSlop={10}
              accessibilityLabel="Quitar foto"
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.placeholder}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={26} color={colors.placeholder} />
            <Text style={styles.placeholderText}>{label}</Text>
          </TouchableOpacity>
        )}
      </View>

      {imageUri ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={15} color="#FB8C00" />
            <Text style={styles.actionButtonText}>Cambiar / recortar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={removeImage}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={15} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {allowPresets ? (
        <View style={styles.presetsBlock}>
          <View style={styles.presetsHeaderRow}>
            <Text style={styles.presetsTitle}>
              {imageUri ? "O elige otra de ejemplo" : "¿Sin foto? Elige una de ejemplo"}
            </Text>
            <TouchableOpacity onPress={() => setPresetModalOpen(true)} hitSlop={8}>
              <Text style={styles.presetsMore}>Ver más</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
          >
            {featured.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.featuredThumbWrap}
                activeOpacity={0.85}
                onPress={() => selectPreset(preset)}
                disabled={!!resolvingId}
              >
                <Image source={preset.source} style={styles.featuredThumb} />
                {resolvingId === preset.id ? (
                  <View style={styles.thumbLoading}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Modal
        visible={presetModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPresetModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Fotos de ejemplo</Text>
              <TouchableOpacity onPress={() => setPresetModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.placeholder} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              {groups.map((group) => (
                <View key={group.category} style={styles.group}>
                  <Text style={styles.groupTitle}>{group.category}</Text>
                  <View style={styles.groupGrid}>
                    {group.items.map((preset) => (
                      <TouchableOpacity
                        key={preset.id}
                        style={styles.gridThumbWrap}
                        activeOpacity={0.85}
                        onPress={() => selectPreset(preset)}
                        disabled={!!resolvingId}
                      >
                        <Image source={preset.source} style={styles.gridThumb} />
                        {resolvingId === preset.id ? (
                          <View style={styles.thumbLoading}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },
  box: {
    height: 150,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  removeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(20,15,10,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  placeholderText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  actionButtonDanger: {
    backgroundColor: `${colors.error}14`,
  },
  actionButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FB8C00",
  },

  // ------- Fotos de ejemplo -------
  presetsBlock: {
    marginTop: 12,
  },
  presetsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  presetsTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  presetsMore: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FB8C00",
  },
  featuredRow: {
    gap: 8,
    paddingRight: 4,
  },
  featuredThumbWrap: {
    width: 78,
    height: 78,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
  },
  featuredThumb: {
    width: "100%",
    height: "100%",
  },
  thumbLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  // ------- Modal "Ver más" -------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 15, 10, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: colors.text,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetContent: {
    paddingBottom: 32,
  },
  group: {
    marginBottom: 18,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridThumbWrap: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
  },
  gridThumb: {
    width: "100%",
    height: "100%",
  },
});
