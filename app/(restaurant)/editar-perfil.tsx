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
import { pickImageFromLibrary } from "../../utils/imagePicker";
import { normalizeSchedule } from "../../utils/restaurantSchedule";
import ProvinceCityPickerBridge from "../../services/provinceCityPicker.bridge";
import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";

// OJO: estos dos siguen siendo del comensal, sin tocar.
import PhoneListEditor from "../components/profile/PhoneListEditor";
import ProfileHero from "../components/profile/ProfileHero";
import ScheduleEditor from "../components/profile/ScheduleEditor";
import SocialLinksEditor from "../components/profile/SocialLinksEditor";

// Propios del restaurante.
import { AppAlert } from "../components/common/AppAlert";
import { Toast } from "../components/common/Toast";
import FormTextField from "../components/restaurant/FormTextField";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

// Pantalla "Configurar perfil", a la que se llega desde el ítem del
// mismo nombre en el menú de "Mi perfil" (perfil.tsx). Es el contenido
// que antes vivía directo en perfil.tsx -- se movió acá para que "Mi
// perfil" pase a ser un menú simple (Configurar perfil / Configurar
// categorías / Configurar delivery), sin todo encimado en una sola
// pantalla larguísima.

export default function EditarPerfilScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

      const pickedProvinceCity = ProvinceCityPickerBridge.consume();
      if (pickedProvinceCity) {
        setEditProvince({ id: pickedProvinceCity.province.id, nombre: pickedProvinceCity.province.nombre });
        setEditCity({
          id: pickedProvinceCity.city.id,
          nombre: pickedProvinceCity.city.nombre,
          latitud: pickedProvinceCity.city.latitud,
          longitud: pickedProvinceCity.city.longitud,
        });
        // La lista de cantones que se muestra si el usuario vuelve a
        // tocar el selector (por si quiere cambiar de cantón dentro de
        // la misma provincia sin re-elegir provincia) también se
        // refresca, para no dejarla con los cantones de la provincia
        // anterior.
        LocationService.getCitiesByProvince(pickedProvinceCity.province.id)
          .then(setCities)
          .catch(() => {});
      }
    }, [])
  );

  async function loadRestaurant() {
    try {
      const data = await RestaurantService.getProfile();
      setRestaurant(data);
      setPhones(data.restaurante_telefonos ?? []);
      setSocialLinks(data.restaurante_redes_sociales ?? []);
      // Siempre 7 filas (Lunes..Domingo). Si el back devolvió menos días,
      // o el domingo como 0 en vez de 7, acá se canoniza -> el editor
      // puede modificar/guardar CUALQUIER día, domingo incluido.
      setSchedule(normalizeSchedule(data.restaurante_horarios));
      await populateDrafts(data);
    } catch (e) {
      console.log("Error cargando restaurante:", e);
    } finally {
      setLoading(false);
    }
  }

  // Antes esto solo corría al tocar "Editar" (startEditing), así que si
  // el usuario agregaba un teléfono/red social/horario -- editable
  // siempre, sin pasar por el toggle de isEditing -- y tocaba "Guardar"
  // sin haber entrado nunca al modo edición de los campos de arriba,
  // editName/editCity/editLocation todavía estaban vacíos y el guardado
  // fallaba con "Datos incompletos" aunque el restaurante sí tuviera
  // nombre/ciudad/ubicación. Ahora se precarga apenas llega la data, así
  // el botón "Guardar cambios" de abajo siempre tiene un draft válido
  // para mandar, haya entrado o no al modo edición de arriba.
  async function populateDrafts(data: Restaurant) {
    setEditName(data.nombre_comercial);
    setEditDescription(data.descripcion ?? "");

    setEditLocation(
      data.ubicacion_lat != null && data.ubicacion_lng != null
        ? {
            latitude: data.ubicacion_lat,
            longitude: data.ubicacion_lng,
            address: data.direccion ?? "",
          }
        : null
    );

    const currentProvinceId = data.ciudad?.provincia?.id;
    const allProvinces = provinces.length > 0 ? provinces : await ProvinceService.getAll();
    if (provinces.length === 0) setProvinces(allProvinces);
    const matchedProvince = allProvinces.find((p) => p.id === currentProvinceId) ?? null;
    setEditProvince(matchedProvince);

    if (matchedProvince) {
      try {
        const cityList = await LocationService.getCitiesByProvince(matchedProvince.id);
        setCities(cityList);
        setEditCity(cityList.find((c) => c.id === data.ciudad?.id) ?? null);
      } catch (e) {
        console.log("Error cargando ciudades:", e);
        setCities([]);
        setEditCity(null);
      }
    } else {
      setCities([]);
      setEditCity(null);
    }
  }

  function startEditing() {
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  // Reusa las mismas pantallas de Provincia/Cantón del onboarding
  // (app/(province)/), en "modo selector" -- antes esto era un par de
  // modales propios de esta pantalla, con su propia lógica de búsqueda
  // duplicada y con un look distinto al resto de la app. Ver
  // provinceCityPicker.bridge.ts para cómo vuelve el resultado acá.
  function openProvinceCityPicker() {
    router.push("/(province)?picker=1" as any);
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
      AppAlert.alert("Falta el cantón", "Elige la provincia y el cantón de tu restaurante.");
      return;
    }
    if (!editLocation) {
      AppAlert.alert("Falta la ubicación", "Selecciona la ubicación de tu restaurante en el mapa.");
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
        telefonos: phones.map((p) => ({
          telefono: p.telefono,
          tipo: "ambos" as const,
        })),
        redesSociales: socialLinks.map((s) => ({
          plataforma: s.plataforma,
          url: s.url,
        })),
        // normalizeSchedule de nuevo acá: garantiza que SIEMPRE se manden
        // los 7 días (1..7) aunque el estado se hubiera quedado corto.
        horarios: normalizeSchedule(schedule).map((d) => ({
          diaSemana: d.dia_semana,
          horaApertura: d.cerrado ? undefined : d.hora_apertura ?? undefined,
          horaCierre: d.cerrado ? undefined : d.hora_cierre ?? undefined,
          cerrado: d.cerrado,
        })),
      });
      setRestaurant(updated);
      setIsEditing(false);
      Toast.success("Perfil actualizado");
    } catch (e) {
      console.log("Error guardando restaurante:", e);
      AppAlert.alert("Error", "No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  // El helper `pickImageFromLibrary` maneja permisos (incluido el caso
  // "no volver a preguntar" -> ofrece abrir Ajustes) y cualquier error
  // del selector nativo, sin dejar promesas colgadas -- antes esto se
  // hacía a mano acá y sin try/catch alrededor del launch.
  async function handleUploadLogo() {
    const picked = await pickImageFromLibrary({ allowsEditing: true, aspect: [1, 1] });
    if (!picked.ok || !picked.asset) return;

    try {
      const response = await RestaurantService.uploadLogo(picked.asset);
      setRestaurant((prev) => (prev ? { ...prev, logo_url: response.logo_url } : prev));
      Toast.success("Logo actualizado");
    } catch (e: any) {
      console.log("Error subiendo logo:", e);
      AppAlert.alert("Error", e?.message || "No se pudo actualizar el logo.");
    }
  }

  async function handleUploadCover() {
    const picked = await pickImageFromLibrary({ allowsEditing: true, aspect: [16, 9] });
    if (!picked.ok || !picked.asset) return;

    try {
      const response = await RestaurantService.uploadCover(picked.asset);
      setRestaurant((prev) => (prev ? { ...prev, portada_url: response.portada_url } : prev));
      Toast.success("Portada actualizada");
    } catch (e: any) {
      console.log("Error subiendo portada:", e);
      AppAlert.alert("Error", e?.message || "No se pudo actualizar la portada.");
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

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingScreen>
        <ScreenHeader
          title="Configurar perfil"
          showBack
          onBack={() => router.back()}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
            {!isEditing && (
              <TouchableOpacity style={styles.editProfileButton} onPress={startEditing} activeOpacity={0.88}>
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                <Text style={styles.editProfileButtonText}>Editar perfil</Text>
              </TouchableOpacity>
            )}

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

            <Text style={styles.pickerLabel}>Provincia/ Cantón</Text>
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
                  ? editCityProvinceLabel ?? "Elige provincia y cantón"
                  : cityProvinceLabel ?? "Sin cantón"}
              </Text>
              {isEditing && <Ionicons name="chevron-down" size={16} color={colors.text} />}
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

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Teléfonos</Text>
            <Text style={styles.disclaimerText}>Se guarda junto con el resto al tocar "Guardar cambios" abajo</Text>
            <PhoneListEditor phones={phones} onAdd={handleAddPhone} onRemove={handleRemovePhone} />

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Redes Sociales</Text>
            <Text style={styles.disclaimerText}>Se guarda junto con el resto al tocar "Guardar cambios" abajo</Text>
            <SocialLinksEditor
              links={socialLinks}
              onAdd={handleAddSocialLink}
              onRemove={handleRemoveSocialLink}
            />

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Horarios de atención</Text>
            <Text style={styles.disclaimerText}>Se guarda junto con el resto al tocar "Guardar cambios" abajo</Text>
            <ScheduleEditor schedule={schedule} onChange={handleScheduleChange} />

            {/* El de "Guardar" queda siempre visible acá abajo (no solo con
                isEditing=true): Teléfonos/Redes/Horarios se editan solos,
                sin pasar por ese toggle, así que tiene que haber una forma
                de guardarlos aunque nunca se haya tocado "Editar perfil"
                arriba. "Cancelar" sí queda atado a isEditing, porque es lo
                único que tiene un estado "original" real al que volver. */}
            <View style={styles.editActionsRow}>
              {isEditing && (
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing} disabled={saving}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.7 }]}
                onPress={saveEditing}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Guardar cambios</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingScreen>
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
    paddingBottom: 60,
  },
  heroWrapper: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F5A800",
    borderRadius: 26,
    height: 52,
    marginBottom: 22,
    shadowColor: "#F5A800",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  editProfileButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
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
    color: colors.text,
  },
  sectionTitleSpaced: {
    marginTop: 24,
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: -6,
    marginBottom: 10,
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
  pickerLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pickerButtonReadOnly: {
    backgroundColor: colors.surfaceSecondary,
  },
  pickerIcon: {
    marginRight: 10,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  placeholderText: {
    color: colors.placeholder,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
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
    color: colors.text,
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: colors.inputBackground,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  modalRow: {
    paddingVertical: 12,
  },
  modalRowText: {
    fontSize: 14,
    color: colors.text,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  emptyListText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 24,
  },
});
