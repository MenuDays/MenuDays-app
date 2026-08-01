import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface AvatarModeProps {
  mode: "avatar";
  title: string;
  subtitle: string;
  photoUrl?: string | null;
  initials: string;
  onPressCamera?: () => void;
}
 
interface CoverModeProps {
  mode: "cover";
  logoUrl?: string | null;
  coverUrl?: string | null;
  onPressEditLogo?: () => void;
  onPressEditCover?: () => void;
}
 
type ProfileHeroProps = AvatarModeProps | CoverModeProps;
 
/**
 * Header reutilizable de perfil.
 * - mode="avatar": el que ya usaba el comensal (avatar circular sobre
 *   fondo con gradiente). NO TOCAR -- comparte estilos con mode="cover"
 *   pero cada uno tiene su propio bloque de estilos separado.
 * - mode="cover": para el restaurante -- imagen de portada de fondo,
 *   logo circular centrado y superpuesto, cada uno con su botón de
 *   editar (solo ícono, sin texto). El nombre/subtítulo del
 *   restaurante ya NO se pinta acá encima de la foto -- ahora es un
 *   campo aparte más abajo en la pantalla (ver RestaurantProfileScreen),
 *   igual que en la referencia visual.
 */
export default function ProfileHero(props: ProfileHeroProps) {
  if (props.mode === "avatar") {
    const { title, subtitle, photoUrl, initials, onPressCamera } = props;
    return (
      <LinearGradient colors={["#FFB640", "#F58A07"]} style={styles.avatarHeader}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
 
        <View style={styles.avatarContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.cameraButton} onPress={onPressCamera}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
 
        <Text style={styles.userName}>{title}</Text>
        <Text style={styles.userSubtitle}>{subtitle}</Text>
      </LinearGradient>
    );
  }
 
  const { logoUrl, coverUrl, onPressEditLogo, onPressEditCover } = props;
  return (
    <View style={styles.coverHeader}>
      {coverUrl ? (
        <>
          <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          <TouchableOpacity style={styles.editCoverButton} onPress={onPressEditCover}>
            <Ionicons name="camera" size={16} color="#3E2723" />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.coverEmpty}
          onPress={onPressEditCover}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={28} color="#BDBDBD" />
          <Text style={styles.coverEmptyText}>Subir portada</Text>
        </TouchableOpacity>
      )}
 
      <View style={styles.logoWrapper}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="storefront" size={28} color="#F5A800" />
          </View>
        )}
        <TouchableOpacity style={styles.cameraButtonLogo} onPress={onPressEditLogo}>
            <Ionicons name="camera" size={13} color="#3E2723" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  /* ---- Modo avatar (comensal) -- sin cambios ---- */
  avatarHeader: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F58A07",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
 
  /* ---- Modo cover (restaurante) ---- */
  coverHeader: {
    height: 170,
    position: "relative",
    // El logo overlapea el borde inferior de la portada -- necesita
    // margen extra debajo para no pisar el contenido que sigue.
    marginBottom: 46,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  editCoverButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logoWrapper: {
    position: "absolute",
    bottom: -40,
    alignSelf: "center",
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  logoPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFF3DE",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButtonLogo: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  coverEmpty: {
  flex: 1,
  borderRadius: 18,
  backgroundColor: "#F5F5F5",
  borderWidth: 1,
  borderColor: "#E0E0E0",
  borderStyle: "dashed",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
},
coverEmptyText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#9E9E9E",
},
});
 