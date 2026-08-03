import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ScreenHeader from "../../components/restaurant/ScreenHeader";
import FormImagePicker from "../../components/restaurant/FormImagePicker";
import FormTextField from "../../components/restaurant/FormTextField";
import FormDateField from "../../components/restaurant/FormDateField";
import PromotionService from "../../../services/promotion.service";
import { AppAlert } from "../../components/common/AppAlert";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function PromotionFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    PromotionService.getById(id)
      .then((promotion) => {
        setTitle(promotion.titulo);
        setDescription(promotion.descripcion ?? "");
        setStartDate(promotion.fecha_inicio.slice(0, 10));
        setEndDate(promotion.fecha_fin.slice(0, 10));
        setImageUri(promotion.imagen_url);
      })
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudo cargar la promoción."))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    if (!title.trim()) {
      AppAlert.alert("Falta el título", "Ingresá el título de la promoción.");
      return false;
    }
    if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
      AppAlert.alert("Faltan fechas", "Completá la fecha de inicio y de fin con el formato AAAA-MM-DD.");
      return false;
    }
    if (startDate > endDate) {
      AppAlert.alert("Fechas inválidas", "La fecha de inicio no puede ser posterior a la de fin.");
      return false;
    }
    if (!isEditing && !imageUri) {
      AppAlert.alert("Falta la foto", "La promoción necesita una foto para poder crearse.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        titulo: title.trim(),
        descripcion: description.trim(),
        fechaInicio: startDate,
        fechaFin: endDate,
        imageUri,
      };

      if (isEditing) {
        await PromotionService.update(id!, payload);
      } else {
        await PromotionService.create(payload);
      }
      router.back();
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo guardar la promoción.");
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
      <KeyboardAvoidingScreen>
        <ScreenHeader title={isEditing ? "Editar promoción" : "Crear promoción"} showBack />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormImagePicker
            imageUri={imageUri}
            onChange={setImageUri}
            label="Subir foto de la promoción"
          />

          <FormTextField
            label="Título"
            placeholder="Ej: 2x1 en hamburguesas"
            value={title}
            onChangeText={setTitle}
            icon="pricetag-outline"
          />

          <FormTextField
            label="Descripción"
            placeholder="Ej: Válido de lunes a jueves"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />

          <FormDateField label="Fecha de inicio" value={startDate} onChangeText={setStartDate} />
          <FormDateField label="Fecha de fin" value={endDate} onChangeText={setEndDate} />

          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
            <LinearGradient
              colors={["#FFB74D", "#FB8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {saving ? "Guardando..." : "Guardar promoción"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingScreen>
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