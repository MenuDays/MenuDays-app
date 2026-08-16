import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import UserService, { User } from "../../services/user.service";
import AuthService from "../../services/auth.service";
import { AppAlert } from "../components/common/AppAlert";
import AdminBottomNav from "../components/admin/AdminBottomNav";
import { usePreviewMode } from "../../contexts/PreviewModeContext";

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

export default function AdminPerfilScreen() {
  const { enterPreview } = usePreviewMode();
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
      AppAlert.alert("Datos incompletos", "Completá nombre y apellido.");
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
      AppAlert.alert("Error", "No se pudo guardar el perfil. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      AppAlert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled) return;

    try {
      const response = await UserService.uploadPhoto(result.assets[0]);
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
    router.push("/(home)");
  }

  function handleLogout() {
    AppAlert.alert(
      "Cerrar sesión",
      "¿Seguro que querés salir del panel de administración?",
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
                <TouchableOpacity style={styles.inlineEditTrigger} onPress={startEditing}>
                  <Ionicons name="create-outline" size={16} color="#F5A800" />
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

      <AdminBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  content: {
    backgroundColor: "#F8F8F8",
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
    gap: 4,
  },
  inlineEditTriggerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F5A800",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#757575",
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