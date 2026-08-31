import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CategoryService, { Category } from "../../../services/category.service";
import DishService from "../../../services/dish.service";
import { AppAlert } from "../../components/common/AppAlert";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import SuccessCelebrationModal from "../../components/common/SuccessCelebrationModal";
import FormCategoryPicker from "../../components/restaurant/FormCategoryPicker";
import FormImagePicker from "../../components/restaurant/FormImagePicker";
import FormTextField from "../../components/restaurant/FormTextField";
import FormToggleRow from "../../components/restaurant/FormToggleRow";
import { isValidPriceInput, parsePriceInput } from "../../../utils/price";
import ScreenHeader from "../../components/restaurant/ScreenHeader";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

const DESCRIPTION_MAX = 500; // @MaxLength(500) en CreateDishDto

export default function DishFormScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [available, setAvailable] = useState(true); // estado: disponible / agotado
  const [active, setActive] = useState(true); // activo: visible en el catálogo
  const [featured, setFeatured] = useState(false); // destacado: carrusel "Platos destacados"
  const [onOffer, setOnOffer] = useState(false); // enOferta: carrusel "Ofertas"
  const [offerPrice, setOfferPrice] = useState(""); // precioOferta (opcional)

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Se recarga al enfocar la pantalla -- así si el usuario entra a
  // "Añadir más categorías" desde el picker y vuelve, las nuevas ya
  // aparecen sin tener que salir y volver a abrir el form.
  const alertedNoCategories = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      CategoryService.getMyCategories()
        .then((cats) => {
          if (cancelled) return;
          setCategories(cats);
          if (cats.length === 0 && !alertedNoCategories.current) {
            alertedNoCategories.current = true;
            AppAlert.alert(
              "Sin categorías",
              "Todavía no elegiste las categorías de tu restaurante. Toca \"Añadir más categorías\" en el selector para elegirlas."
            );
          }
        })
        .catch((e) => {
          if (!cancelled) AppAlert.alert("Error", e.message || "No se pudieron cargar las categorías.");
        })
        .finally(() => {
          if (!cancelled) setCategoriesLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

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
        setFeatured(dish.destacado);
        setOnOffer(dish.en_oferta);
        setOfferPrice(dish.precio_oferta != null ? String(dish.precio_oferta) : "");
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
    if (!isValidPriceInput(price, { allowZero: false })) {
      AppAlert.alert("Precio inválido", "Ingresa un precio válido. Puedes usar coma o punto (ej. 12,50 o 12.50).");
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
    if (onOffer && offerPrice.trim() && !isValidPriceInput(offerPrice)) {
      AppAlert.alert("Precio de oferta inválido", "Ingresa un precio de oferta válido, o déjalo vacío.");
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
  precio: parsePriceInput(price),
  categoriaId: categoryId!,
  estado: available ? ("disponible" as const) : ("agotado" as const),
  activo: true,
  destacado: featured,
  enOferta: onOffer,
  precioOferta: onOffer && offerPrice.trim() ? parsePriceInput(offerPrice) : null,
  imageUri,
};

if (isEditing) {
  await DishService.update(id!, {
    ...payload,
    activo: active,
  });
  router.back();
} else {
  await DishService.create(payload);
  // Solo festeja al CREAR -- una edición de rutina no es un logro para
  // celebrar cada vez.
  setShowSuccess(true);
}
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

          <Text style={styles.sectionLabel}>Vitrina para el comensal</Text>
          <Text style={styles.sectionHint}>
            Un plato puede aparecer en ninguno, uno o los dos carruseles de la pantalla
            principal del comensal.
          </Text>

          <FormToggleRow
            label="Plato destacado"
            value={featured}
            onValueChange={setFeatured}
          />

          <FormToggleRow
            label="En oferta"
            value={onOffer}
            onValueChange={setOnOffer}
          />

          {onOffer && (
            <FormTextField
              label="Precio de oferta (opcional)"
              placeholder="Dejalo vacío para mostrar el badge sin precio tachado"
              value={offerPrice}
              onChangeText={setOfferPrice}
              icon="pricetag-outline"
              keyboardType="decimal-pad"
            />
          )}

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

      <SuccessCelebrationModal
        visible={showSuccess}
        title="¡Plato publicado!"
        message="Tu plato ya está listo para que lo vean tus clientes."
        onClose={() => {
          setShowSuccess(false);
          router.back();
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenSolid,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.screenSolid,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 18,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
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