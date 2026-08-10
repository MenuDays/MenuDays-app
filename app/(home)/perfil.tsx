import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";

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
import RestaurantRequestService, {
  RestaurantRequestStatus,
} from "../../services/restaurant-request.service";
import { useDeviceLocation } from "../../hooks/useDeviceLocation";

import ProfileHero from "../components/profile/ProfileHero";
import ProfileCard from "../components/profile/ProfileCard";
import LocationCard from "../components/profile/LocationCard";
import InfoRow from "../components/profile/InfoRow";
import EditableRow from "../components/profile/EditableRow";
import Divider from "../components/profile/Divider";
import { AppAlert } from "../components/common/AppAlert";

export default function PerfilScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (e) {
      console.log("Error cargando usuario:", e);
    } finally {
      setLoading(false);
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
              router.replace("/(auth)/login");
            }
          },
        },
      ]
    );
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

  if (!user) return null;

  const cityProvinceLabel =
    gpsCityProvince ??
    (user.city?.name && user.province?.name
      ? `${user.city.name}, ${user.province.name}`
      : null);

  const restaurantCardConfig = getRestaurantCardConfig(requestStatus);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <ProfileHero
          mode="avatar"
          title={`${user.firstName} ${user.lastName}`}
          subtitle={user.email}
          photoUrl={user.profilePhotoUrl}
          initials={`${user.firstName[0]}${user.lastName[0]}`}
        />

        <View style={styles.content}>

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
            <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
          </TouchableOpacity>

          {!checkingRequest && (
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
  content: {
    backgroundColor: "#F8F8F8",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
    marginTop: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
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
    backgroundColor: "#FFF9EC",
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
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
    fontWeight: "600",
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