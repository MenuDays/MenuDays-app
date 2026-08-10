import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthService from "../../services/auth.service";
import LocationService, { City } from "../../services/location.service";
import ProvinceService, { Province } from "../../services/province.service";
import RestaurantService, {
  RedSocial,
  Restaurant,
  RestaurantPhone,
  RestaurantSchedule,
  RestaurantSocialLink,
} from "../../services/restaurant.service";
import RestaurantLocationPickerBridge from "../../services/restaurantLocationPicker.bridge";
import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";

// OJO: estos dos siguen siendo del comensal, sin tocar.
import PhoneListEditor from "../components/profile/PhoneListEditor";
import ProfileHero from "../components/profile/ProfileHero";
import ScheduleEditor from "../components/profile/ScheduleEditor";
import SocialLinksEditor from "../components/profile/SocialLinksEditor";

// Propios del restaurante.
import { AppAlert } from "../components/common/AppAlert";
import FormTextField from "../components/restaurant/FormTextField";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import ScreenHeader from "../components/restaurant/ScreenHeader";

export default function RestaurantProfileScreen() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [editProvince, setEditProvince] = useState<Province | null>(null);
  const [editCity, setEditCity] = useState<City | null>(null);
  const [editLocation, setEditLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [provincePickerVisible, setProvincePickerVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const [phones, setPhones] = useState<RestaurantPhone[]>([]);
  const [socialLinks, setSocialLinks] = useState<RestaurantSocialLink[]>([]);
  const [schedule, setSchedule] = useState<RestaurantSchedule[]>([]);

  useEffect(() => {
    loadRestaurant();
    ProvinceService.getAll().then(setProvinces);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const picked = RestaurantLocationPickerBridge.consume();
      if (picked) setEditLocation(picked);
    }, [])
  );

  async function loadRestaurant() {
    try {
      const data = await RestaurantService.getProfile();
      setRestaurant(data);
      setPhones(data.restaurante_telefonos ?? []);
      setSocialLinks(data.restaurante_redes_sociales ?? []);
      setSchedule(data.restaurante_horarios ?? []);
    } catch (e) {
      console.log("Error cargando restaurante:", e);
    } finally {
      setLoading(false);
    }
  }

  async function startEditing() {
    if (!restaurant) return;
    setEditName(restaurant.nombre_comercial);
    setEditDescription(restaurant.descripcion ?? "");

    setEditLocation(
      restaurant.ubicacion_lat != null && restaurant.ubicacion_lng != null
        ? {
            latitude: restaurant.ubicacion_lat,
            longitude: restaurant.ubicacion_lng,
            address: restaurant.direccion ?? "",
          }
        : null
    );

    const currentProvinceId = restaurant.ciudad?.provincia?.id;
    const matchedProvince = provinces.find((p) => p.id === currentProvinceId) ?? null;
    setEditProvince(matchedProvince);

    if (matchedProvince) {
      try {
        const cityList = await LocationService.getCitiesByProvince(matchedProvince.id);
        setCities(cityList);
        setEditCity(cityList.find((c) => c.id === restaurant.ciudad?.id) ?? null);
      } catch (e) {
        console.log("Error cargando ciudades:", e);
        setCities([]);
        setEditCity(null);
      }
    } else {
      setCities([]);
      setEditCity(null);
    }

    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  function openProvinceCityPicker() {
    setProvincePickerVisible(true);
  }

  async function handleSelectProvince(selected: Province) {
    setEditProvince(selected);
    setEditCity(null);
    setProvincePickerVisible(false);
    setProvinceSearch("");

    try {
      const data = await LocationService.getCitiesByProvince(selected.id);
      setCities(data);
      setCityPickerVisible(true);
    } catch (e) {
      console.log("Error cargando ciudades:", e);
      setCities([]);
    }
  }

  function handleSelectCity(selected: City) {
    setEditCity(selected);
    setCityPickerVisible(false);
    setCitySearch("");
  }

  function pickLocationOnMap() {
    router.push({
      pathname: "/(auth)/select-restaurant-location",
      params: {
        cityName: editCity?.nombre ?? "",
        provinceName: editProvince?.nombre ?? "",
      },
    });
  }

  async function saveEditing() {
    if (!restaurant) return;

    if (!editName.trim()) {
      AppAlert.alert("Datos incompletos", "El nombre comercial no puede quedar vacío.");
      return;
    }
    if (!editCity) {
      AppAlert.alert("Falta la ciudad", "Elegí la provincia y ciudad de tu restaurante.");
      return;
    }
    if (!editLocation) {
      AppAlert.alert("Falta la ubicación", "Seleccioná la ubicación de tu restaurante en el mapa.");
      return;
    }

    setSaving(true);
    try {
      const updated = await RestaurantService.updateProfile({
        nombreComercial: editName.trim(),
        descripcion: editDescription.trim(),
        direccion: editLocation.address,
        ciudadId: editCity.id,
        ubicacionLat: editLocation.latitude,
        ubicacionLng: editLocation.longitude,
      });
      setRestaurant(updated);
      setIsEditing(false);
    } catch (e) {
      console.log("Error guardando restaurante:", e);
      AppAlert.alert("Error", "No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }
async function handleUploadLogo() {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    AppAlert.alert(
      "Permiso requerido",
      "Necesitamos acceso a tu galería."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });

  if (result.canceled) return;

  try {
    const response = await RestaurantService.uploadLogo(
      result.assets[0]
    );

    setRestaurant((prev) =>
      prev
        ? {
            ...prev,
            logo_url: response.logo_url,
          }
        : prev
    );

    AppAlert.alert(
      "¡Listo!",
      "Logo actualizado correctamente."
    );
  } catch (e) {
    console.log("Error subiendo logo:", e);

    AppAlert.alert(
      "Error",
      "No se pudo actualizar el logo."
    );
  }
}

async function handleUploadCover() {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    AppAlert.alert(
      "Permiso requerido",
      "Necesitamos acceso a tu galería."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });

  if (result.canceled) return;

  try {
    const response = await RestaurantService.uploadCover(
      result.assets[0]
    );

    setRestaurant((prev) =>
      prev
        ? {
            ...prev,
            portada_url: response.portada_url,
          }
        : prev
    );

    AppAlert.alert(
      "¡Listo!",
      "Portada actualizada correctamente."
    );
  } catch (e) {
    console.log("Error subiendo portada:", e);

    AppAlert.alert(
      "Error",
      "No se pudo actualizar la portada."
    );
  }
}
  function handleAddPhone(telefono: string) {
    setPhones((prev) => [...prev, { id: Date.now(), telefono }]);
  }
  function handleRemovePhone(id: number) {
    setPhones((prev) => prev.filter((p) => p.id !== id));
  }
  function handleAddSocialLink(plataforma: RedSocial, url: string) {
    setSocialLinks((prev) => [...prev, { id: Date.now(), plataforma, url }]);
  }
  function handleRemoveSocialLink(id: number) {
    setSocialLinks((prev) => prev.filter((s) => s.id !== id));
  }
  function handleScheduleChange(dayId: number, patch: Partial<RestaurantSchedule>) {
    setSchedule((prev) => prev.map((d) => (d.id === dayId ? { ...d, ...patch } : d)));
  }

  function handleLogout() {
    AppAlert.alert("Cerrar sesión", "¿Seguro que querés cerrar tu sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await AuthService.logout();
          } catch (e) {
            console.log("Error al cerrar sesión:", e);
          } finally {
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5A800" />
      </View>
    );
  }

  if (!restaurant) return null;

  const cityProvinceLabel =
    restaurant.ciudad?.nombre && restaurant.ciudad?.provincia?.nombre
      ? `${restaurant.ciudad.provincia.nombre}, ${restaurant.ciudad.nombre}`
      : null;

  const editCityProvinceLabel =
    editProvince && editCity ? `${editProvince.nombre}, ${editCity.nombre}` : null;

  const filteredProvinces = provinces.filter((p) =>
    p.nombre.toLowerCase().includes(provinceSearch.toLowerCase())
  );
  const filteredCities = cities.filter((c) =>
    c.nombre.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingScreen>
        <ScreenHeader
          title="Mi perfil"
          showBack
          rightIcon={!isEditing ? "create-outline" : undefined}
          onRightPress={startEditing}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroWrapper}>
            <ProfileHero
              mode="cover"
              logoUrl={restaurant.logo_url}
              coverUrl={restaurant.portada_url}
              onPressEditLogo={handleUploadLogo}
onPressEditCover={handleUploadCover}
            />
          </View>

          <View style={styles.content}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Información del negocio</Text>
            </View>

            <FormTextField
              label="Nombre del restaurante"
              value={isEditing ? editName : restaurant.nombre_comercial}
              onChangeText={setEditName}
              icon="storefront-outline"
              editable={isEditing}
            />

            <FormTextField
              label="Descripción"
              value={isEditing ? editDescription : restaurant.descripcion ?? "Sin descripción todavía"}
              onChangeText={setEditDescription}
              multiline
              maxLength={200}
              placeholder="Contale a tus clientes de qué se trata tu restaurante"
              editable={isEditing}
            />

            <Text style={styles.pickerLabel}>Provincia/ Ciudad</Text>
            <TouchableOpacity
              style={[styles.pickerButton, !isEditing && styles.pickerButtonReadOnly]}
              onPress={isEditing ? openProvinceCityPicker : undefined}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              <Ionicons name="compass-outline" size={18} color="#F5A800" style={styles.pickerIcon} />
              <Text
                style={[
                  styles.pickerButtonText,
                  !(isEditing ? editCityProvinceLabel : cityProvinceLabel) && styles.placeholderText,
                ]}
              >
                {isEditing
                  ? editCityProvinceLabel ?? "Elegí provincia y ciudad"
                  : cityProvinceLabel ?? "Sin ciudad"}
              </Text>
              {isEditing && <Ionicons name="chevron-down" size={16} color="#3E2723" />}
            </TouchableOpacity>

            <Text style={styles.pickerLabel}>Ubicación del restaurante</Text>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={isEditing ? pickLocationOnMap : undefined}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              <Ionicons name="pin" size={18} color="#FB8C00" style={styles.pickerIcon} />
              <Text style={styles.mapButtonText} numberOfLines={1}>
                {(isEditing ? editLocation?.address : restaurant.direccion) ||
                  "Seleccionar ubicación en el mapa"}
              </Text>
              {isEditing && <Ionicons name="chevron-down" size={16} color="#FB8C00" />}
            </TouchableOpacity>

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

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Teléfonos</Text>
            <PhoneListEditor phones={phones} onAdd={handleAddPhone} onRemove={handleRemovePhone} />

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Redes Sociales</Text>
            <SocialLinksEditor
              links={socialLinks}
              onAdd={handleAddSocialLink}
              onRemove={handleRemoveSocialLink}
            />

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Horarios de atención</Text>
            <ScheduleEditor schedule={schedule} onChange={handleScheduleChange} />

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#E53935" />
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingScreen>

      <RestaurantBottomNav />

      {/* Selector de provincia */}
      <Modal
        visible={provincePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProvincePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elegí la provincia</Text>
              <TouchableOpacity onPress={() => setProvincePickerVisible(false)}>
                <Ionicons name="close" size={24} color="#3E2723" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={18} color="#9E9E9E" style={styles.pickerIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar provincia"
                placeholderTextColor="#9E9E9E"
                value={provinceSearch}
                onChangeText={setProvinceSearch}
              />
            </View>

            <FlatList
              data={filteredProvinces}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalRow} onPress={() => handleSelectProvince(item)}>
                  <Text style={styles.modalRowText}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
            />
          </View>
        </View>
      </Modal>

      {/* Selector de ciudad */}
      <Modal
        visible={cityPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCityPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Elegí la ciudad{editProvince ? ` (${editProvince.nombre})` : ""}
              </Text>
              <TouchableOpacity onPress={() => setCityPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#3E2723" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={18} color="#9E9E9E" style={styles.pickerIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar ciudad"
                placeholderTextColor="#9E9E9E"
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalRow} onPress={() => handleSelectCity(item)}>
                  <Text style={styles.modalRowText}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No hay ciudades para esta provincia</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    // deja lugar para que la bottom nav flotante no tape lo último
    paddingBottom: 110,
  },
  heroWrapper: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  sectionTitleSpaced: {
    marginTop: 24,
    marginBottom: 10,
  },
  editTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editTriggerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F5A800",
  },
  editActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
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
  pickerLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3E2723",
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pickerButtonReadOnly: {
    backgroundColor: "#FAFAFA",
  },
  pickerIcon: {
    marginRight: 10,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 14,
    color: "#3E2723",
  },
  placeholderText: {
    color: "#9E9E9E",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFA726",
    backgroundColor: "#FFF8EE",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mapButtonText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#FB8C00",
  },
   logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    gap: 8,
    marginTop: 28,
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F44336",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3E2723",
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#3E2723",
  },
  modalRow: {
    paddingVertical: 12,
  },
  modalRowText: {
    fontSize: 14,
    color: "#3E2723",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F5F5F5",
  },
  emptyListText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 14,
    paddingVertical: 24,
  },
});