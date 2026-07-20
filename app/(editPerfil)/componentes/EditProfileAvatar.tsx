import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface EditProfileAvatarProps {
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string | null;
  onPressCamera: () => void;
}

export default function EditProfileAvatar({
  firstName,
  lastName,
  profilePhotoUrl,
  onPressCamera,
}: EditProfileAvatarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {profilePhotoUrl ? (
          <Image
            source={{ uri: profilePhotoUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>
              {firstName.charAt(0).toUpperCase()}
              {lastName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.cameraButton}
          activeOpacity={0.8}
          onPress={onPressCamera}
        >
          <Ionicons
            name="camera"
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.name}>
        {firstName} {lastName}
      </Text>

      <Text style={styles.subtitle}>
        Toca la cámara para cambiar tu foto
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: -50,
    marginBottom: 28,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },

  avatarPlaceholder: {
    width: 125,
    height: 125,
    borderRadius: 62.5,

    backgroundColor: "#F5A800",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 4,
    borderColor: "#FFFFFF",

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },

  initials: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  cameraButton: {
    position: "absolute",
    bottom: 2,
    right: 2,

    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor: "#F58A07",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 3,
    borderColor: "#FFFFFF",

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 5,
  },

  name: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#8A8A8A",
  },
});