import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

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
 *   pero cada uno tiene su propio bloque de estilos separado. El
 *   gradiente naranja es igual en Light y Dark (identidad de marca), así
 *   que este modo no necesita tokens de tema.
 * - mode="cover": para el restaurante -- imagen de portada de fondo,
 *   logo circular centrado y superpuesto, cada uno con su propio botón
 *   de editar (solo ícono, sin texto). Estos SÍ se apoyan en el fondo de
 *   la pantalla (blanco/oscuro según el tema), así que usan `colors`.
 */
export default function ProfileHero(props: ProfileHeroProps) {
  const { colors } = useTheme();

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
          <TouchableOpacity
            style={[styles.editCoverButton, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={onPressEditCover}
          >
            <Ionicons name="camera" size={16} color={colors.text} />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[
            styles.coverEmpty,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
          onPress={onPressEditCover}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={28} color={colors.placeholder} />
          <Text style={[styles.coverEmptyText, { color: colors.textSecondary }]}>Subir portada</Text>
        </TouchableOpacity>
      )}

      <View style={styles.logoWrapper}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={[styles.logo, { borderColor: colors.card }]} />
        ) : (
          <View
            style={[
              styles.logoPlaceholder,
              { borderColor: colors.card, backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Ionicons name="storefront" size={28} color={colors.primary} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.cameraButtonLogo, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onPressEditLogo}
        >
            <Ionicons name="camera" size={13} color={colors.text} />
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
    alignItems: "center",
    justifyContent: "center",
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
  },
  logoPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  coverEmpty: {
  flex: 1,
  borderRadius: 18,
  borderWidth: 1,
  borderStyle: "dashed",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
},
coverEmptyText: {
  fontSize: 14,
  fontWeight: "600",
},
});

