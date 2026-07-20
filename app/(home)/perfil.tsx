import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserService, { User } from "../../services/user.service";

const { width } = Dimensions.get("window");

export default function PerfilScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modo edición
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");

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
    setEditEmail(user.email);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  async function saveEditing() {
    if (!user) return;

    if (!editName.trim() || !editLastName.trim() || !editEmail.trim()) {
      Alert.alert("Datos incompletos", "Completa nombre, apellido y email.");
      return;
    }

    setSaving(true);
    try {
      const updated = await UserService.updateProfile({
        firstName: editName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
      });
      const newUser = updated ?? { ...user, firstName: editName.trim(), lastName: editLastName.trim(), email: editEmail.trim() };
      setUser(newUser);
      await UserService.saveLocal(newUser);
      setIsEditing(false);
    } catch (e) {
      console.log("Error guardando perfil:", e);
      Alert.alert("Error", "No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient
          colors={["#FFB640", "#F58A07"]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Mi perfil</Text>

          {/* Foto de perfil */}
          <View style={styles.avatarContainer}>
            {user.profilePhotoUrl ? (
              <Image
                source={{ uri: user.profilePhotoUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {user.firstName[0]}{user.lastName[0]}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </LinearGradient>

        <View style={styles.content}>

          {/* Información personal */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Información personal</Text>
            {!isEditing && (
              <TouchableOpacity
  style={styles.inlineEditTrigger}
  onPress={startEditing}
>
  <Ionicons
    name="create-outline"
    size={16}
    color="#F5A800"
  />
  <Text style={styles.inlineEditTriggerText}>
    Editar
  </Text>
</TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            {isEditing ? (
              <>
                <EditableRow
                  icon="person-outline"
                  label="Nombre"
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                />
                <Divider />
                <EditableRow
                  icon="person-outline"
                  label="Apellido"
                  value={editLastName}
                  onChangeText={setEditLastName}
                />
                <Divider />
                <EditableRow
                  icon="mail-outline"
                  label="Email"
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                <InfoRow
                  icon="person-outline"
                  label="Nombre"
                  value={user.firstName}
                />
                <Divider />
                <InfoRow
                  icon="person-outline"
                  label="Apellido"
                  value={user.lastName}
                />
                <Divider />
                <InfoRow
                  icon="mail-outline"
                  label="Email"
                  value={user.email}
                />
              </>
            )}
          </View>

          {/* Botones guardar/cancelar cuando está editando */}
          {isEditing && (
            <View style={styles.editActionsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEditing}
                disabled={saving}
              >
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

          {/* Ubicación */}
          <Text style={styles.sectionTitle}>Ubicación</Text>

          <View style={styles.card}>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#F5A800" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationCity}>
                  {user.city?.name}, {user.province?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editLocationButton}
                onPress={() => router.push("/(province)")}
              >
                <Text style={styles.editLocationText}>Cambiar</Text>
                <Ionicons name="chevron-forward" size={14} color="#F5A800" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card registrar restaurante */}
          <TouchableOpacity
            style={styles.restaurantCard}
            onPress={() => router.push("/(auth)/register-restaurant")}
            activeOpacity={0.85}
          >
            <View style={styles.restaurantCardHeader}>
              <View style={styles.restaurantIcon}>
                <Ionicons name="storefront" size={22} color="#F5A800" />
              </View>
              <View style={styles.restaurantCardText}>
                <Text style={styles.restaurantCardTitle}>
                  ¿Eres dueño de un negocio?
                </Text>
                <Text style={styles.restaurantCardSubtitle}>
                  Quiero registrar mi restaurante
                </Text>
              </View>
            </View>

            <Text style={styles.restaurantCardBody}>
              Únete a la red más grande de gastronomía en Ecuador. Completa
              el formulario y solicita convertirte en un restaurante
              verificado para llegar a miles de comensales.
            </Text>

            <LinearGradient
              colors={["#FFB640", "#F58A07"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.restaurantButton}
            >
              <Text style={styles.restaurantButtonText}>
                Registrar restaurante
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cerrar sesión */}
          <TouchableOpacity style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componentes auxiliares
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon as any}
        size={18}
        color="#F5A800"
        style={styles.infoIcon}
      />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function EditableRow({
  icon,
  label,
  value,
  onChangeText,
  autoFocus,
  keyboardType,
  autoCapitalize,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon as any}
        size={18}
        color="#F5A800"
        style={styles.infoIcon}
      />
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={styles.infoInput}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#BDBDBD"
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
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
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  content: {
    backgroundColor: "#F8F8F8",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
    marginTop: 4,
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#757575",
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "right",
  },
  infoInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "right",
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF9EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  locationAddress: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  editLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  editLocationText: {
    fontSize: 13,
    color: "#F5A800",
    fontWeight: "600",
  },
  restaurantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
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
    color: "#1A1A1A",
  },
  restaurantCardSubtitle: {
    fontSize: 13,
    color: "#F5A800",
    marginTop: 2,
  },
  restaurantCardBody: {
    fontSize: 14,
    color: "#555555",
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
});