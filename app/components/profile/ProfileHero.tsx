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

          {/* Antes este botón no se renderizaba -- el estilo existía
              (cameraButton) pero nunca se usaba en el JSX, así que no
              había forma de tocar nada para cambiar la foto. */}
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={onPressCamera}
            activeOpacity={0.85}
            hitSlop={8}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{title}</Text>
        <Text style={styles.userSubtitle}>{subtitle}</Text>
      </LinearGradient>
    );
  }

  const { logoUrl, coverUrl, onPressEditLogo, onPressEditCover } = props;
  return (
    // El contenedor externo mide portada + el tramo que el logo sobresale
    // por abajo (antes el logo estaba `bottom:-50` FUERA de este View: en
    // Android, la parte de un hijo que cae fuera de los límites del padre
    // NO recibe toques -> el botón de "cambiar logo" quedaba muerto en
    // varios dispositivos). Ahora el logo queda DENTRO de los límites.
    <View style={styles.coverHeader}>
      <View style={styles.coverImageArea}>
        {coverUrl ? (
          <>
            <Image source={{ uri: coverUrl }} style={styles.coverImage} />
            {/* Fade inferior: la portada se funde con el fondo, sin línea de
                corte dura donde termina la imagen. */}
            <LinearGradient
              colors={["transparent", colors.surface]}
              style={styles.coverFade}
              pointerEvents="none"
            />
            <TouchableOpacity
              style={[styles.editCoverButton, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
              onPress={onPressEditCover}
              hitSlop={8}
            >
              <Ionicons name="camera" size={20} color={colors.text} />
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
      </View>

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
            <Ionicons name="storefront" size={46} color={colors.primary} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.cameraButtonLogo, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onPressEditLogo}
          hitSlop={8}
        >
            <Ionicons name="camera" size={17} color={colors.text} />
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
    bottom: -2,
    right: -2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F58A07",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
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
  // Alto total = portada (170) + lo que el logo (104, centrado en el
  // borde inferior de la portada) sobresale hacia abajo (52). Así el
  // logo y su botón de editar quedan DENTRO de los límites del padre y
  // son táctiles en Android. El contenido que sigue arranca 6px después,
  // igual que antes (170 + 58 de marginBottom).
  coverHeader: {
    height: 222,
    position: "relative",
    marginBottom: 6,
  },
  coverImageArea: {
    height: 170,
    width: "100%",
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  coverFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  editCoverButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logoWrapper: {
    position: "absolute",
    // 4px de aire hasta el borde del contenedor -> el botón de la cámara
    // (bottom:-2) y su sombra quedan holgadamente dentro y táctiles.
    bottom: 4,
    alignSelf: "center",
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
  },
  logoPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButtonLogo: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
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

