import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";

import UserService, { User } from "../../services/user.service";
import AuthService from "../../services/auth.service";
import { pickImageFromLibrary } from "../../utils/imagePicker";
import { AppAlert } from "../components/common/AppAlert";
import AdminBottomNav from "../components/admin/AdminBottomNav";
import { usePreviewMode } from "../../contexts/PreviewModeContext";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Reutiliza los mismos componentes de perfil que el comensal
// ((home)/perfil.tsx) -- un admin es solo una fila más de `usuarios`
// con rol=administrador (ver usuarios.service.ts en el back,
// buildProfileResponse), así que GET /users/profile funciona igual acá.
// A diferencia del comensal, no hay sección de ubicación, favoritos ni
// tarjeta de "registrar restaurante" -- eso es específico del rol
// comensal y no aplica para el panel de administración.
import ProfileHero from "../components/profile/ProfileHero";
import ProfileCard from "../components/profile/ProfileCard";
import InfoRow from "../components/profile/InfoRow";
import EditableRow from "../components/profile/EditableRow";
import Divider from "../components/profile/Divider";
import ThemeToggle from "../components/common/ThemeToggle";

export default function AdminPerfilScreen() {
  const { enterPreview, exitPreview } = usePreviewMode();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const data = await UserService.getMe();
      setUser(data);
    } catch (e) {
      console.log("Error cargando usuario:", e);
    } finally {
      setLoading(false);
    }
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

  function handleViewAsComensal() {
    enterPreview("administrador");
    router.push("/(home)/(tabs)");
  }

  function handleLogout() {
    AppAlert.alert(
      "Cerrar sesión",
      "¿Seguro que quieres salir del panel de administración?",
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
              // Evita que quede colgado el banner de "Salir de vista
              // previa" para la próxima sesión en este mismo dispositivo.
              exitPreview();
              router.replace("/(auth)/login");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5A800" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <ProfileHero
          mode="avatar"
          title={`${user.firstName} ${user.lastName}`}
          subtitle={user.email}
          photoUrl={user.profilePhotoUrl}
          initials={`${user.firstName[0]}${user.lastName[0]}`}
          onPressCamera={handleUploadPhoto}
        />

        <View style={styles.content}>

          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#F5A800" />
            <Text style={styles.roleBadgeText}>Administrador</Text>
          </View>

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
              </>
            )}
          </ProfileCard>

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

          {/* Tema oscuro -- mismo control que en el perfil de comensal
              ((home)/(tabs)/perfil.tsx), ver allowDarkMode en ThemeContext. */}
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuRowIcon}>
                <Ionicons name="moon-outline" size={20} color="#F5A800" />
              </View>
              <Text style={styles.menuRowText}>Tema oscuro</Text>
            </View>
            <ThemeToggle size={32} />
          </View>

          <TouchableOpacity style={styles.previewButton} onPress={handleViewAsComensal}>
            <Ionicons name="eye-outline" size={18} color="#F5A800" />
            <Text style={styles.previewButtonText}>Ver como comensal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      </KeyboardAvoidingScreen>

      <AdminBottomNav />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  scrollContent: {
    // Espacio para pasar de largo la bottom nav flotante (si no, "Cerrar
    // sesión" quedaba tapado y la pantalla parecía que no scrolleaba).
    paddingBottom: 130,
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 18,
    paddingTop: 24,
    // deja lugar para que la AdminBottomNav flotante no tape lo último
    paddingBottom: 110,
  },
  roleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF6E2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F5A800",
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
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    gap: 8,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F5A800",
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5A800",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F44336",
  },
});