import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppAlert } from "../common/AppAlert";

interface FormImagePickerProps {
  imageUri: string | null;
  onChange: (uri: string) => void;
  label?: string;
  aspect?: [number, number];
}

export default function FormImagePicker({
  imageUri,
  onChange,
  label = "Subir foto",
  aspect = [4, 3],
}: FormImagePickerProps) {
  async function pickImage() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      AppAlert.alert(
        "Permiso necesario",
        "Necesitamos acceso a tus fotos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      aspect,
      // Sin editor nativo: selecciona la foto directamente.
      allowsEditing: false,
    });

    if (!result.canceled) {
      onChange(result.assets[0].uri);
    }
  }

  return (
    <TouchableOpacity
      style={styles.box}
      onPress={pickImage}
      activeOpacity={0.85}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name="camera-outline"
            size={26}
            color="#BDBDBD"
          />
          <Text style={styles.placeholderText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 150,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    marginBottom: 20,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  placeholderText: {
    fontSize: 13,
    color: "#9E9E9E",
  },
});