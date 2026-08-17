import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CategoryService, { Category } from "../../../services/category.service";
import DishService from "../../../services/dish.service";
import { AppAlert } from "../../components/common/AppAlert";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import FormCategoryPicker from "../../components/restaurant/FormCategoryPicker";
import FormImagePicker from "../../components/restaurant/FormImagePicker";
import FormTextField from "../../components/restaurant/FormTextField";
import FormToggleRow from "../../components/restaurant/FormToggleRow";
import ScreenHeader from "../../components/restaurant/ScreenHeader";

const DESCRIPTION_MAX = 500; // @MaxLength(500) en CreateDishDto

export default function DishFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [available, setAvailable] = useState(true); // estado: disponible / agotado
  const [active, setActive] = useState(true); // activo: visible en el catálogo

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CategoryService.getMyCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length === 0) {
          AppAlert.alert(
            "Sin categorías",
            "Todavía no elegiste las categorías de tu restaurante. Ve a Mi perfil > Categorías para elegirlas antes de crear un plato."
          );
        }
      })
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudieron cargar las categorías."))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    DishService.getById(id)
      .then((dish) => {
        setName(dish.nombre);
        setDescription(dish.descripcion ?? "");
        setPrice(String(dish.precio));
        setCategoryId(dish.categoria_id);
        setAvailable(dish.estado === "disponible");
        setActive(dish.activo);
        setImageUri(dish.plato_imagenes[0]?.url ?? null);
      })
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudo cargar el plato."))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    if (!name.trim()) {
      AppAlert.alert("Falta el nombre", "Ingresa el nombre del plato.");
      return false;
    }
    if (!description.trim()) {
      AppAlert.alert("Falta la descripción", "Ingresa una descripción del plato.");
      return false;
    }
    if (!price.trim() || isNaN(Number(price))) {
      AppAlert.alert("Precio inválido", "Ingresa un precio válido.");
      return false;
    }
    if (!categoryId) {
      AppAlert.alert("Falta la categoría", "Elige una categoría para el plato.");
      return false;
    }
    if (!isEditing && !imageUri) {
      AppAlert.alert("Falta la foto", "El plato necesita una foto para poder crearse.");
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
  descripcion: description.trim(),
  precio: Number(price),
  categoriaId: categoryId!,
  estado: available ? ("disponible" as const) : ("agotado" as const),
  activo: true,
  imageUri,
};

if (isEditing) {
  await DishService.update(id!, {
    ...payload,
    activo: active,
  });
} else {
  await DishService.create(payload);
}

router.back();
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo guardar el plato.");
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
        <ScreenHeader title={isEditing ? "Editar plato" : "Crear plato"} showBack />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormImagePicker
            imageUri={imageUri}
            onChange={setImageUri}
            label="Subir foto del plato"
          />

          <FormTextField
            label="Nombre del plato"
            placeholder="Ingresa el nombre del plato"
            value={name}
            onChangeText={setName}
            icon="restaurant-outline"
          />

          <FormTextField
            label="Descripción"
            placeholder="Ej: Milanesa de carne acompañada de papas fritas"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={DESCRIPTION_MAX}
          />

          <FormTextField
            label="Precio"
            placeholder="Ingresa el precio del plato"
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

          <FormToggleRow
            label="Disponible ahora"
            value={available}
            onValueChange={setAvailable}
          />

          <FormToggleRow
            label="Activo en el catálogo"
            value={active}
            onValueChange={setActive}
          />

          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
            <LinearGradient
              colors={["#FFB74D", "#FB8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {saving ? "Guardando..." : "Guardar plato"}
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