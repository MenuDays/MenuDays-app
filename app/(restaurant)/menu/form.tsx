import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CategoryService, { Category } from "../../../services/category.service";
import MenuService, { Menu } from "../../../services/menu.service";
import { AppAlert } from "../../components/common/AppAlert";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import FormCategoryPicker from "../../components/restaurant/FormCategoryPicker";
import FormDateField from "../../components/restaurant/FormDateField";
import FormImagePicker from "../../components/restaurant/FormImagePicker";
import FormTextField from "../../components/restaurant/FormTextField";
import FormToggleRow from "../../components/restaurant/FormToggleRow";
import ScreenHeader from "../../components/restaurant/ScreenHeader";
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
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [publishOnSave, setPublishOnSave] = useState(true);
  const [currentEstado, setCurrentEstado] = useState<Menu["estado"] | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    CategoryService.getMyCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length === 0) {
          AppAlert.alert(
            "Sin categorías",
            "Todavía no elegiste las categorías de tu restaurante. Andá a Mi perfil > Categorías para elegirlas antes de crear un menú."
          );
        }
      })
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudieron cargar las categorías."))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    MenuService.getById(id)
      .then((menu) => {
        setName(menu.nombre);
        setDescription(menu.descripcion ?? "");
        setPrice(String(menu.precio));
        setStartDate(menu.fecha_inicio.slice(0, 10));
        setEndDate(menu.fecha_fin.slice(0, 10));
        setCategoryId(menu.categoria_id);
        setImageUri(menu.foto_url);
        setCurrentEstado(menu.estado);
        setPublishOnSave(menu.estado === "publicado");
      })
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudo cargar el menú."))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    if (!name.trim()) {
      AppAlert.alert("Falta el nombre", "Ingresa el nombre del menú.");
      return false;
    }
    if (!price.trim() || isNaN(Number(price))) {
      AppAlert.alert("Precio inválido", "Ingresa un precio válido.");
      return false;
    }
    if (!startDate.trim() || !endDate.trim()) {
      AppAlert.alert("Faltan fechas", "Ingresa la fecha de inicio y fin del menú.");
      return false;
    }
    if (!categoryId) {
      AppAlert.alert("Falta la categoría", "Elige una categoría para el menú.");
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
        categoriaId: categoryId!,
        imageUri,
      };

      let savedMenu: Menu;
      if (isEditing) {
        savedMenu = await MenuService.update(id!, payload);
      } else {
        savedMenu = await MenuService.create(payload as any);
      }

      // El create/update no acepta "estado" (el back siempre lo deja en
      // "programado" al crear, o lo respeta tal cual al editar). Si el
      // usuario quiere que quede publicado/oculto según el switch, se
      // resuelve con un toggle aparte -- ver PATCH /menus/:id/toggle.
      const shouldBePublished = publishOnSave;
      const isCurrentlyPublished = savedMenu.estado === "publicado";
      if (shouldBePublished !== isCurrentlyPublished) {
        await MenuService.toggle(savedMenu.id);
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
      <KeyboardAvoidingScreen>
        <ScreenHeader title={isEditing ? "Editar menú" : "Crear menú"} showBack />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormImagePicker
            imageUri={imageUri}
            onChange={setImageUri}
            label="Subir foto del plato"
          />

          <FormTextField
            label="Nombre del menú"
            placeholder="Ingresa el nombre del menú"
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
            placeholder="Ingresa el precio del menú"
            value={price}
            onChangeText={setPrice}
            icon="pricetag-outline"
            keyboardType="decimal-pad"
          />

          <FormCategoryPicker
            label="Categoría"
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            loading={categoriesLoading}
          />

          <Text style={styles.label}>Programar fechas</Text>
          {/* TODO: reemplazar por un date picker real (ej.
              @react-native-community/datetimepicker) que arme el string
              en formato YYYY-MM-DD -- el backend usa @IsDateString y
              rechaza cualquier otro formato. */}
          <FormDateField
  label="Fecha de inicio"
  value={startDate}
  onChangeText={setStartDate}
/>

<FormDateField
  label="Fecha de fin"
  value={endDate}
  onChangeText={setEndDate}
/>
          {/* El create/update no acepta "estado" directamente -- después
              de guardar, handleSave compara este valor contra el estado
              real del menú y llama a MenuService.toggle() si hace falta
              (ver PATCH /menus/:id/toggle). */}
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