import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import UserService, { User } from "../../../services/user.service";
import AuthService from "../../../services/auth.service";
import { pickImageFromLibrary } from "../../../utils/imagePicker";
import RestaurantRequestService, {
  RestaurantRequestStatus,
} from "../../../services/restaurant-request.service";
import { useDeviceLocation } from "../../../hooks/useDeviceLocation";

import ProfileHero from "../../components/profile/ProfileHero";
import ProfileCard from "../../components/profile/ProfileCard";
import LocationCard from "../../components/profile/LocationCard";
import InfoRow from "../../components/profile/InfoRow";
import EditableRow from "../../components/profile/EditableRow";
import Divider from "../../components/profile/Divider";
import ThemeToggle from "../../components/common/ThemeToggle";
import { AppAlert } from "../../components/common/AppAlert";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";
import { usePreviewMode } from "../../../contexts/PreviewModeContext";

export default function PerfilScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { previewOrigin, exitPreview } = usePreviewMode();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [requestStatus, setRequestStatus] =
    useState<RestaurantRequestStatus | null>(null);
  const [checkingRequest, setCheckingRequest] = useState(true);

  const {
    street: gpsStreet,
    cityProvince: gpsCityProvince,
    loading: locationLoading,
  } = useDeviceLocation(user?.latitude, user?.longitude);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadUser();
      checkRequestStatus();
    }, [])
  );

  async function loadUser() {
    try {
      const data = await UserService.getMe();
      setUser(data);
      setLoadError(null);
    } catch (e: any) {
      console.log("Error cargando usuario:", e);
      // Sin esto, cualquier falla (red, 401, error del back) dejaba la
      // pantalla completamente en blanco para siempre -- `user` nunca se
      // llenaba y no había ningún estado que mostrar en su lugar.
      setLoadError(e?.message || "No se pudo cargar tu perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadPhoto() {
    const picked = await pickImageFromLibrary();
    if (!picked.ok || !picked.asset) return;

    try {
      const response = await UserService.uploadPhoto(picked.asset);
      setUser((prev) => (prev ? { ...prev, profilePhotoUrl: response.photoUrl } : prev));
      if (user) await UserService.saveLocal({ ...user, profilePhotoUrl: response.photoUrl });
      AppAlert.alert("¡Listo!", "Foto de perfil actualizada correctamente.");
    } catch (e) {
      console.log("Error subiendo foto de perfil:", e);
      AppAlert.alert("Error", "No se pudo actualizar la foto de perfil.");
    }
  }

  async function checkRequestStatus() {
    try {
      const data = await RestaurantRequestService.getStatus();
      setRequestStatus(data);
    } catch {
      setRequestStatus(null); // 404 = nunca solicitó
    } finally {
      setCheckingRequest(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    Promise.all([loadUser(), checkRequestStatus()]).finally(() => setRefreshing(false));
  }

  function startEditing() {
    if (!user) return;
    setEditName(user.firstName);
    setEditLastName(user.lastName);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  async function saveEditing() {
    if (!user) return;

    if (!editName.trim() || !editLastName.trim()) {
      AppAlert.alert("Datos incompletos", "Completa nombre y apellido.");
      return;
    }

    setSaving(true);
    try {
      const updated = await UserService.updateProfile({
        firstName: editName.trim(),
        lastName: editLastName.trim(),
      });
      const newUser = updated ?? { ...user, firstName: editName.trim(), lastName: editLastName.trim() };
      setUser(newUser);
      await UserService.saveLocal(newUser);
      setIsEditing(false);
    } catch (e) {
      console.log("Error guardando perfil:", e);
      AppAlert.alert("Error", "No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    AppAlert.alert(
      "Cerrar sesión",
      "¿Estás seguro que quieres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await AuthService.logout();
            } catch (e) {
              console.log("Error en logout remoto, limpiando sesión local igual:", e);
            } finally {
              // Sin esto, si este comensal había entrado en "Ver como
              // comensal" desde admin/restaurante (o si la próxima
              // sesión en este mismo dispositivo es de otro rol), el
              // banner de "Salir de vista previa" podía quedar visible
              // para un comensal real que nunca activó el preview.
              exitPreview();
              router.replace("/(auth)/login");
            }
          },
        },
      ]
    );
  }

  // "Volver a mi panel": sale del modo "ver como comensal" y vuelve al
  // dashboard del rol real (admin o restaurante). El rol REAL manda (se
  // lee de la sesión), previewOrigin es solo el fallback.
  async function handleBackToOwnPanel() {
    let rol: string | null = previewOrigin;
    try {
      const session = await AuthService.getSession();
      if (session?.user?.rol) rol = session.user.rol;
    } catch {
      /* usamos previewOrigin */
    }
    exitPreview();
    router.replace(rol === "administrador" ? "/(admin)/dashboard" : "/(restaurant)/dashboard");
  }

  function handleRestaurantCardPress() {
    if (checkingRequest) return;
    if (!requestStatus) {
      router.push("/(auth)/register-restaurant");
      return;
    }
    router.push("/requestStatus");
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5A800" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.placeholder} />
        <Text style={styles.errorText}>
          {loadError || "No se pudo cargar tu perfil."}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUser} activeOpacity={0.85}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cityProvinceLabel =
    gpsCityProvince ??
    (user.city?.name && user.province?.name
      ? `${user.city.name}, ${user.province.name}`
      : null);

  const restaurantCardConfig = getRestaurantCardConfig(requestStatus);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
      >

        <ProfileHero
          mode="avatar"
          title={`${user.firstName} ${user.lastName}`}
          subtitle={user.email}
          photoUrl={user.profilePhotoUrl}
          initials={`${user.firstName[0]}${user.lastName[0]}`}
          onPressCamera={handleUploadPhoto}
        />

        <View style={styles.content}>

          <ProfileCard
            title="Información personal"
            headerRight={
              !isEditing && (
                <TouchableOpacity style={styles.inlineEditTrigger} onPress={startEditing} activeOpacity={0.85}>
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.inlineEditTriggerText}>Editar</Text>
                </TouchableOpacity>
              )
            }
          >
            {isEditing ? (
              <>
                <EditableRow icon="person-outline" label="Nombre" value={editName} onChangeText={setEditName} autoFocus />
                <Divider />
                <EditableRow icon="person-outline" label="Apellido" value={editLastName} onChangeText={setEditLastName} />
                <Divider />
                <InfoRow icon="lock-closed-outline" label="Email" value={user.email} />
              </>
            ) : (
              <>
                <InfoRow icon="person-outline" label="Nombre" value={user.firstName} />
                <Divider />
                <InfoRow icon="person-outline" label="Apellido" value={user.lastName} />
                <Divider />
                <InfoRow icon="mail-outline" label="Email" value={user.email} />
                <Divider />
                <InfoRow
                  icon="call-outline"
                  label="Teléfono"
                  value={user.phoneNumber || "Sin definir"}
                />
              </>
            )}
          </ProfileCard>

          {/* Cuentas de restaurante casi nunca completan un teléfono/
              ubicación "personal" propios -- el back ya devuelve acá
              los de su restaurante como fallback (ver
              usingRestaurantInfo), pero se aclara para que no se lea
              como si fuera un dato de comensal cualquiera. */}
          {user.usingRestaurantInfo && (
            <View style={styles.restaurantInfoNote}>
              <Ionicons name="information-circle-outline" size={15} color="#B0793A" />
              <Text style={styles.restaurantInfoNoteText}>
                Esta ubicación y teléfono son los de tu restaurante -- todavía no cargaste datos
                personales de comensal.
              </Text>
            </View>
          )}

          {isEditing && (
            <View style={styles.editActionsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing} disabled={saving}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.7 }]}
                onPress={saveEditing}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Ubicación</Text>
          <LocationCard
            primaryLabel={gpsStreet}
            secondaryLabel={cityProvinceLabel}
            loading={locationLoading}
            onPressChange={() => router.push("/(province)")}
          />

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.85}
            onPress={() => router.push("/(home)/favoritos")}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuRowIcon}>
                <Ionicons name="heart-outline" size={20} color="#F5A800" />
              </View>
              <Text style={styles.menuRowText}>Favoritos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
          </TouchableOpacity>

          {/* Tema oscuro -- disponible para los 3 roles (ver allowDarkMode
              en ThemeContext). Admin y restaurante tienen el mismo control
              en (admin)/perfil.tsx y (restaurant)/perfil.tsx. */}
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuRowIcon}>
                <Ionicons name="moon-outline" size={20} color="#F5A800" />
              </View>
              <Text style={styles.menuRowText}>Tema oscuro</Text>
            </View>
            <ThemeToggle size={32} />
          </View>

          {previewOrigin && (
            <TouchableOpacity
              style={styles.backToPanelButton}
              onPress={handleBackToOwnPanel}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#FFB74D", "#FB8C00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.backToPanelGradient}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.backToPanelText}>
                  {previewOrigin === "administrador"
                    ? "Volver a mi panel de admin"
                    : "Volver a mi panel de restaurante"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {!checkingRequest && !previewOrigin && (
            <TouchableOpacity
              style={styles.restaurantCard}
              onPress={handleRestaurantCardPress}
              activeOpacity={0.85}
            >
              <View style={styles.restaurantCardHeader}>
                <View style={[styles.restaurantIcon, { backgroundColor: restaurantCardConfig.iconBg }]}>
                  <Ionicons name={restaurantCardConfig.icon} size={22} color={restaurantCardConfig.iconColor} />
                </View>
                <View style={styles.restaurantCardText}>
                  <Text style={styles.restaurantCardTitle}>{restaurantCardConfig.title}</Text>
                  <Text style={[styles.restaurantCardSubtitle, { color: restaurantCardConfig.iconColor }]}>
                    {restaurantCardConfig.subtitle}
                  </Text>
                </View>
              </View>

              <Text style={styles.restaurantCardBody}>{restaurantCardConfig.body}</Text>

              <LinearGradient
                colors={restaurantCardConfig.buttonColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.restaurantButton}
              >
                <Text style={styles.restaurantButtonText}>{restaurantCardConfig.buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      </KeyboardAvoidingScreen>
    </SafeAreaView>
  );
}

function getRestaurantCardConfig(requestStatus: RestaurantRequestStatus | null) {
  if (!requestStatus) {
    return {
      icon: "storefront" as const,
      iconBg: "#FFF9EC",
      iconColor: "#F5A800",
      title: "¿Eres dueño de un negocio?",
      subtitle: "Quiero registrar mi restaurante",
      body:
        "Únete a la red más grande de gastronomía en Ecuador. Completa el formulario y solicita convertirte en un restaurante verificado para llegar a miles de comensales.",
      buttonText: "Registrar restaurante",
      buttonColors: ["#FFB640", "#F58A07"] as const,
    };
  }

  switch (requestStatus.status) {
    case "pendiente":
      return {
        icon: "time" as const,
        iconBg: "#FFF3E0",
        iconColor: "#F5A800",
        title: "Solicitud en revisión",
        subtitle: "Estado: pendiente",
        body: `Tu solicitud para "${requestStatus.restaurantName}" está siendo revisada por nuestro equipo.`,
        buttonText: "Ver estado",
        buttonColors: ["#FFB640", "#F58A07"] as const,
      };
    case "aprobada":
      return {
        icon: "checkmark-circle" as const,
        iconBg: "#E8F5E9",
        iconColor: "#4CAF50",
        title: "¡Solicitud aprobada!",
        subtitle: "Ya eres restaurante",
        body: `Tu solicitud para "${requestStatus.restaurantName}" fue aprobada. Cerra sesión y vuelve a ingresar para acceder al panel de restaurante.`,
        buttonText: "Ver estado",
        buttonColors: ["#66BB6A", "#43A047"] as const,
      };
    case "rechazada":
    default:
      return {
        icon: "close-circle" as const,
        iconBg: "#FFEBEE",
        iconColor: "#E53935",
        title: "Solicitud rechazada",
        subtitle: "Puedes volver a intentarlo",
        body:
          requestStatus.adminObservations
            ? `Motivo: ${requestStatus.adminObservations}`
            : "Tu solicitud anterior no fue aprobada. Puedes revisar los detalles y enviar una nueva solicitud.",
        buttonText: "Ver detalle",
        buttonColors: ["#EF5350", "#E53935"] as const,
      };
  }
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: "#F5A800",
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 40,
  },
  inlineEditTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5A800",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: "#F5A800",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  inlineEditTriggerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  editActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    marginTop: -8,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5A800",
    gap: 6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  restaurantInfoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FFF1DC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  restaurantInfoNoteText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#8A5A1E",
    fontWeight: "500",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  restaurantCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  restaurantCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  restaurantIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF9EC",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantCardText: {
    flex: 1,
  },
  restaurantCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  restaurantCardSubtitle: {
    fontSize: 13,
    color: "#F5A800",
    marginTop: 2,
    fontWeight: "600",
  },
  restaurantCardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  restaurantButton: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F44336",
  },
  backToPanelButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 16,
    shadowColor: "#F5751A",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  backToPanelGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backToPanelText: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "800",
  },
});
