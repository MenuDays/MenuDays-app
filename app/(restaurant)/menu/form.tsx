import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ScreenHeader from "../../components/restaurant/ScreenHeader";
import FormImagePicker from "../../components/restaurant/FormImagePicker";
import FormTextField from "../../components/restaurant/FormTextField";
import FormToggleRow from "../../components/restaurant/FormToggleRow";
import MenuService from "../../../services/menu.service";
import { AppAlert } from "../../components/common/AppAlert";

const DESCRIPTION_MAX = 500; // @MaxLength(500) en CreateMenuDto

export default function MenuFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [publishOnSave, setPublishOnSave] = useState(true);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    MenuService.getById(id)
      .then((menu) => {
        setName(menu.nombre);
        setDescription(menu.descripcion ?? "");
        setPrice(String(menu.precio));
        setStartDate(menu.fecha_inicio.slice(0, 10));
        setEndDate(menu.fecha_fin.slice(0, 10));
        setImageUri(menu.foto_url);
      })
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudo cargar el menú."))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    if (!name.trim()) {
      AppAlert.alert("Falta el nombre", "Ingresá el nombre del menú.");
      return false;
    }
    if (!price.trim() || isNaN(Number(price))) {
      AppAlert.alert("Precio inválido", "Ingresá un precio válido.");
      return false;
    }
    if (!startDate.trim() || !endDate.trim()) {
      AppAlert.alert("Faltan fechas", "Ingresá la fecha de inicio y fin del menú.");
      return false;
    }
    if (!isEditing && !imageUri) {
      AppAlert.alert("Falta la foto", "El menú necesita una foto para poder crearse.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nombre: name.trim(),
        descripcion: description.trim() || undefined,
        precio: Number(price),
        fechaInicio: startDate.trim(),
        fechaFin: endDate.trim(),
        imageUri,
      };

      if (isEditing) {
        await MenuService.update(id!, payload);
      } else {
        await MenuService.create(payload as any);
      }
      router.back();
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo guardar el menú.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FB8C00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={isEditing ? "Editar menú" : "Crear menú"} showBack />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormImagePicker
          imageUri={imageUri}
          onChange={setImageUri}
          label="Subir foto del plato"
        />

        <FormTextField
          label="Nombre del menú"
          placeholder="Ingresá el nombre del menú"
          value={name}
          onChangeText={setName}
          icon="restaurant-outline"
        />

        <FormTextField
          label="Descripción"
          placeholder="Ej: Seco de pollo con arroz, menestra y ensalada fresca"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={DESCRIPTION_MAX}
        />

        <FormTextField
          label="Precio"
          placeholder="Ingresá el precio del menú"
          value={price}
          onChangeText={setPrice}
          icon="pricetag-outline"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Programar fechas</Text>
        {/* TODO: reemplazar por un date picker real (ej.
            @react-native-community/datetimepicker) que arme el string
            en formato YYYY-MM-DD -- el backend usa @IsDateString y
            rechaza cualquier otro formato. */}
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <FormTextField
              label=""
              placeholder="AAAA-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
              icon="calendar-outline"
            />
          </View>
          <View style={styles.dateField}>
            <FormTextField
              label=""
              placeholder="AAAA-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
              icon="calendar-outline"
            />
          </View>
        </View>
        <Text style={styles.dateHint}>Dejá vacío si es solo para hoy</Text>

        {/* OJO: el switch queda visual por ahora -- el backend todavía
            no tiene un campo/endpoint para publicar el menú al crearlo
            (nace siempre en "programado"). Cuando se agregue, wireear
            este valor al payload de MenuService.create(). */}
        <FormToggleRow
          label="Publicar al guardar"
          value={publishOnSave}
          onValueChange={setPublishOnSave}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          <LinearGradient
            colors={["#FFB74D", "#FB8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {saving ? "Guardando..." : "Guardar menú"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3E2723",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  dateField: {
    flex: 1,
  },
  dateHint: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: -8,
    marginBottom: 20,
  },
  button: {
    borderRadius: 26,
    overflow: "hidden",
    marginTop: 8,
  },
  buttonGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});