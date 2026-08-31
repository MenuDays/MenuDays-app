import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CategoryService, { Category } from "../../../services/category.service";
import MenuService, { Menu, MenuScheduleType, getMenuComponents } from "../../../services/menu.service";
import { AppAlert } from "../../components/common/AppAlert";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import FormCategoryPicker from "../../components/restaurant/FormCategoryPicker";
import FormDateField from "../../components/restaurant/FormDateField";
import FormImagePicker from "../../components/restaurant/FormImagePicker";
import FormTextField from "../../components/restaurant/FormTextField";
import FormToggleRow from "../../components/restaurant/FormToggleRow";
import ScreenHeader from "../../components/restaurant/ScreenHeader";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";
import { isValidPriceInput, parsePriceInput } from "../../../utils/price";

const DESCRIPTION_MAX = 500; // @MaxLength(500) en CreateMenuDto
const TAG_MAX_LENGTH = 40;
const MAX_TAGS = 15;

const FIXED_MENU_TYPES = [
  { key: "entrada", label: "Entradas", icon: "restaurant-outline", color: "#FB8C00" },
  { key: "sopa", label: "Sopas", icon: "nutrition-outline", color: "#FFA726" },
  { key: "platoFuerte", label: "Plato Fuerte", icon: "fast-food-outline", color: "#F57C00" },
  { key: "jugo", label: "Jugo", icon: "cafe-outline", color: "#FFCA28" },
  { key: "postre", label: "Postre", icon: "ice-cream-outline", color: "#FFB300" },
] as const;

type ComponentKey = (typeof FIXED_MENU_TYPES)[number]["key"];

const WEEKDAYS = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "X" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 7, label: "D" },
];

const SCHEDULE_OPTIONS: { value: MenuScheduleType; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "fecha", label: "Programar fecha" },
  { value: "semanal", label: "Semanal" },
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MenuFormScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // coleccionId: concepto legado. Ya NO se muestra en la UI de crear/editar
  // menú (el restaurante arma el menú por componentes, ver arriba), pero el
  // valor se sigue transportando en silencio: si se edita un menú viejo que
  // ya tenía colección asignada, no se pierde. `coleccionId` en la URL solo
  // llega desde algún link viejo.
  const { id, coleccionId } = useLocalSearchParams<{ id?: string; coleccionId?: string }>();
  const isEditing = !!id;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(coleccionId ?? null);
  const [publishOnSave, setPublishOnSave] = useState(true);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Cada tipo admite VARIOS nombres -- ej. dos entradas distintas ese
  // día. componentDrafts guarda el texto que se está tipeando ANTES de
  // "agregar" (separado de la lista ya confirmada).
  const [componentes, setComponentes] = useState<Record<ComponentKey, string[]>>({
    entrada: [],
    sopa: [],
    platoFuerte: [],
    jugo: [],
    postre: [],
  });
  const [componentDrafts, setComponentDrafts] = useState<Record<ComponentKey, string>>({
    entrada: "",
    sopa: "",
    platoFuerte: "",
    jugo: "",
    postre: "",
  });
  // Cuál de los 5 tipos tiene su input de "agregar" desplegado ahora --
  // solo uno a la vez. Tocar el "+" de un tipo abre SU input nada más.
  const [openComponentType, setOpenComponentType] = useState<ComponentKey | null>(null);
  const [existingMenus, setExistingMenus] = useState<Menu[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [scheduleType, setScheduleType] = useState<MenuScheduleType>("fecha");
  const [diasSemana, setDiasSemana] = useState<number[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Solo para armar las sugerencias de componentes (componentHistory
  // abajo) -- no bloquea nada si falla, es una comodidad, no un dato
  // requerido para crear/editar el menú.
  useEffect(() => {
    MenuService.getAll()
      .then(setExistingMenus)
      .catch(() => {});
  }, []);

  // Sugerencias por tipo: todo lo que el restaurante ya haya escrito
  // antes en cada uno de los 5 componentes, sacado de sus propios menús
  // existentes -- sin límite de cuántas se acumulen.
  const componentHistory = useMemo<Record<ComponentKey, string[]>>(() => {
    const history: Record<ComponentKey, Set<string>> = {
      entrada: new Set(),
      sopa: new Set(),
      platoFuerte: new Set(),
      jugo: new Set(),
      postre: new Set(),
    };
    for (const menu of existingMenus) {
      const comps = getMenuComponents(menu);
      (Object.keys(history) as ComponentKey[]).forEach((key) => {
        comps[key].forEach((value) => history[key].add(value));
      });
    }
    return {
      entrada: Array.from(history.entrada),
      sopa: Array.from(history.sopa),
      platoFuerte: Array.from(history.platoFuerte),
      jugo: Array.from(history.jugo),
      postre: Array.from(history.postre),
    };
  }, [existingMenus]);

  // Se recarga al enfocar la pantalla -- así si el usuario entra a
  // "Añadir más categorías" desde el picker y vuelve, las nuevas ya
  // aparecen.
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
    MenuService.getById(id)
      .then((menu) => {
        setName(menu.nombre);
        setDescription(menu.descripcion ?? "");
        setPrice(String(menu.precio));
        setStartDate(menu.fecha_inicio.slice(0, 10));
        setEndDate(menu.fecha_fin.slice(0, 10));
        setCategoryId(menu.categoria_id);
        setCollectionId(menu.coleccion_id);
        setImageUri(menu.foto_url);
        setPublishOnSave(menu.estado === "publicado");

        const comps = getMenuComponents(menu);
        setComponentes({
          entrada: comps.entrada,
          sopa: comps.sopa,
          platoFuerte: comps.platoFuerte,
          jugo: comps.jugo,
          postre: comps.postre,
        });
        setTags(menu.tags ?? []);
        setScheduleType(menu.tipo_programacion ?? "fecha");
        setDiasSemana(menu.dias_semana ?? []);
      })
      .catch((e) => AppAlert.alert("Error", e.message || "No se pudo cargar el menú."))
      .finally(() => setLoading(false));
  }, [id]);

  function setComponentDraft(key: ComponentKey, value: string) {
    setComponentDrafts((prev) => ({ ...prev, [key]: value }));
  }

  // Tocar el "+" de un tipo abre SU input nada más -- cierra cualquier
  // otro que hubiera quedado abierto (solo uno a la vez).
  function openComponentInput(key: ComponentKey) {
    setOpenComponentType(key);
    setComponentDrafts((prev) => ({ ...prev, [key]: "" }));
  }

  // "Cancelar": cierra el input sin agregar lo que se haya tipeado.
  function cancelComponentInput() {
    if (!openComponentType) return;
    setComponentDrafts((prev) => ({ ...prev, [openComponentType]: "" }));
    setOpenComponentType(null);
  }

  // "Guardar" (o tocar una sugerencia): agrega el nombre a la lista de
  // ese tipo -- sin duplicados -- y cierra el input.
  function saveComponentEntry(key: ComponentKey, valueOverride?: string) {
    const value = (valueOverride ?? componentDrafts[key]).trim();
    if (value) {
      setComponentes((prev) =>
        prev[key].includes(value) ? prev : { ...prev, [key]: [...prev[key], value] }
      );
    }
    setComponentDrafts((prev) => ({ ...prev, [key]: "" }));
    setOpenComponentType(null);
  }

  function removeComponentEntry(key: ComponentKey, value: string) {
    setComponentes((prev) => ({ ...prev, [key]: prev[key].filter((v) => v !== value) }));
  }

  function addTag() {
    const value = tagInput.trim();
    if (!value) return;
    if (tags.length >= MAX_TAGS || tags.includes(value)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function toggleWeekday(day: number) {
    setDiasSemana((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function validate() {
    if (!name.trim()) {
      AppAlert.alert("Falta el nombre", "Ingresa el nombre del menú.");
      return false;
    }
    if (!isValidPriceInput(price, { allowZero: false })) {
      AppAlert.alert("Precio inválido", "Ingresa un precio válido. Puedes usar coma o punto (ej. 12,50 o 12.50).");
      return false;
    }
    if (!categoryId) {
      AppAlert.alert("Falta la categoría", "Elige una categoría para el menú.");
      return false;
    }
    const hasAnyComponent = Object.values(componentes).some((arr) => arr.length > 0);
    if (!isEditing && !hasAnyComponent) {
      AppAlert.alert(
        "Falta al menos un plato",
        'Completa el nombre de al menos uno de los 5 tipos (Entrada, Sopa, Plato Fuerte, Jugo o Postre). El resto puede quedar en "Ninguno".'
      );
      return false;
    }
    if (scheduleType !== "hoy" && (!startDate.trim() || !endDate.trim())) {
      AppAlert.alert("Faltan fechas", "Ingresa la fecha de inicio y fin del menú.");
      return false;
    }
    if (scheduleType === "semanal" && diasSemana.length === 0) {
      AppAlert.alert("Faltan días", "Elige al menos un día de la semana.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const fechaInicio = scheduleType === "hoy" ? todayIsoDate() : startDate.trim();
      const fechaFin = scheduleType === "hoy" ? todayIsoDate() : endDate.trim();

      const payload = {
        nombre: name.trim(),
        descripcion: description.trim() || undefined,
        precio: parsePriceInput(price),
        fechaInicio,
        fechaFin,
        categoriaId: categoryId!,
        coleccionId: collectionId ?? undefined,
        imageUri,
        componenteEntrada: componentes.entrada,
        componenteSopa: componentes.sopa,
        componentePlatoFuerte: componentes.platoFuerte,
        componenteJugo: componentes.jugo,
        componentePostre: componentes.postre,
        tags,
        tipoProgramacion: scheduleType,
        diasSemana: scheduleType === "semanal" ? diasSemana : undefined,
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
      //
      // Este toggle va en su propio try/catch: el menú YA se guardó
      // (create/update de arriba resolvió bien) -- si esto falla, no
      // tiene sentido mostrarle "Error" al usuario como si no se hubiera
      // guardado nada. Se avisa aparte y el estado se puede corregir
      // después con el botón de ojito de la lista.
      const shouldBePublished = publishOnSave;
      const isCurrentlyPublished = savedMenu.estado === "publicado";
      if (shouldBePublished !== isCurrentlyPublished) {
        try {
          await MenuService.toggle(savedMenu.id);
        } catch (toggleError: any) {
          console.log("Menú guardado, pero falló el toggle de estado:", toggleError);
          AppAlert.alert(
            "Menú guardado",
            "Se guardó correctamente, pero no se pudo actualizar su visibilidad. Puedes cambiarla desde la lista con el ícono del ojo."
          );
          router.back();
          return;
        }
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
          {/* ------- Componentes: uno por vez, tocando su "+" ------- */}
          <Text style={styles.label}>¿Qué incluye este menú?</Text>
          <Text style={styles.sublabel}>
            Toca el "+" de cada tipo para registrar un nombre (puedes cargar cuantos quieras).
            Si lo dejas vacío, cuenta como "Ninguno".
          </Text>
          <View style={styles.componentsList}>
            {FIXED_MENU_TYPES.map((type) => {
              const entries = componentes[type.key];
              const isOpen = openComponentType === type.key;
              const suggestions = componentHistory[type.key].filter((s) => !entries.includes(s));
              return (
                <View key={type.key} style={styles.componentGroup}>
                  <View style={styles.componentHeaderRow}>
                    <View style={[styles.componentIcon, { backgroundColor: `${type.color}1A` }]}>
                      <Ionicons name={type.icon as any} size={16} color={type.color} />
                    </View>
                    <Text style={styles.componentTypeLabel}>{type.label}</Text>
                    {entries.length === 0 && !isOpen && (
                      <View style={styles.noneBadge}>
                        <Text style={styles.noneBadgeText}>Ninguno</Text>
                      </View>
                    )}
                    {!isOpen && (
                      <TouchableOpacity
                        style={[styles.componentAddButton, { backgroundColor: type.color }]}
                        onPress={() => openComponentInput(type.key)}
                        hitSlop={6}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {entries.length > 0 && (
                    <View style={styles.componentChipsWrap}>
                      {entries.map((name) => (
                        <TouchableOpacity
                          key={name}
                          style={[styles.componentChip, { borderColor: `${type.color}40` }]}
                          onPress={() => removeComponentEntry(type.key, name)}
                        >
                          <Text style={[styles.componentChipText, { color: type.color }]}>
                            {name}
                          </Text>
                          <Ionicons name="close" size={13} color={type.color} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Input de "registrar [tipo]" -- solo el de ESTE tipo,
                      no los 5 juntos. Aparece nada más al tocar el "+". */}
                  {isOpen && (
                    <>
                      <View style={styles.componentRow}>
                        <TextInput
                          autoFocus
                          style={styles.componentInput}
                          placeholder={`Registrar ${type.label.toLowerCase().replace(/s$/, "")}...`}
                          placeholderTextColor={colors.placeholder}
                          value={componentDrafts[type.key]}
                          onChangeText={(v) => setComponentDraft(type.key, v)}
                          onSubmitEditing={() => saveComponentEntry(type.key)}
                          maxLength={150}
                          returnKeyType="done"
                        />
                      </View>

                      <View style={styles.componentInputActions}>
                        <TouchableOpacity
                          style={styles.componentCancelButton}
                          onPress={cancelComponentInput}
                        >
                          <Text style={styles.componentCancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.componentSaveButton, { backgroundColor: type.color }]}
                          onPress={() => saveComponentEntry(type.key)}
                        >
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          <Text style={styles.componentSaveButtonText}>Guardar</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Sugerencias: nombres que ya usaste antes para
                          este tipo, en otros menús -- tocar una la
                          agrega directo. */}
                      {suggestions.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          keyboardShouldPersistTaps="handled"
                          style={styles.suggestionsRow}
                          contentContainerStyle={styles.suggestionsRowContent}
                        >
                          {suggestions.map((suggestion) => (
                            <TouchableOpacity
                              key={suggestion}
                              style={[styles.suggestionChip, { borderColor: `${type.color}40` }]}
                              onPress={() => saveComponentEntry(type.key, suggestion)}
                            >
                              <Ionicons name="checkbox-outline" size={13} color={type.color} />
                              <Text style={[styles.suggestionChipText, { color: type.color }]}>
                                {suggestion}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>

          <FormImagePicker
            imageUri={imageUri}
            onChange={setImageUri}
            label="Subir foto del menú (opcional)"
            allowPresets
            presetCategory={
              categories.find((c) => c.id === categoryId)?.nombre ?? null
            }
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

          {/* ------- Palabras clave (chips) ------- */}
          <Text style={styles.label}>Palabras clave</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder="Ej: picante, vegetariano..."
              placeholderTextColor={colors.placeholder}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              maxLength={TAG_MAX_LENGTH}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.tagAddButton} onPress={addTag}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsWrap}>
              {tags.map((tag) => (
                <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => removeTag(tag)}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <Ionicons name="close" size={13} color="#B0793A" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ------- Programación ------- */}
          <Text style={styles.label}>¿Cuándo está disponible?</Text>
          <View style={styles.scheduleRow}>
            {SCHEDULE_OPTIONS.map((opt) => {
              const active = scheduleType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.scheduleChip, active && styles.scheduleChipActive]}
                  onPress={() => {
                    setScheduleType(opt.value);
                    if (!startDate) setStartDate(todayIsoDate());
                    if (!endDate) setEndDate(todayIsoDate());
                  }}
                >
                  <Text style={[styles.scheduleChipText, active && styles.scheduleChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {scheduleType === "semanal" && (
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((day) => {
                const active = diasSemana.includes(day.value);
                return (
                  <TouchableOpacity
                    key={day.value}
                    style={[styles.weekdayChip, active && styles.weekdayChipActive]}
                    onPress={() => toggleWeekday(day.value)}
                  >
                    <Text style={[styles.weekdayChipText, active && styles.weekdayChipTextActive]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {scheduleType !== "hoy" && (
            <>
              <FormDateField
                label={scheduleType === "semanal" ? "Se repite desde" : "Fecha de inicio"}
                value={startDate}
                onChangeText={setStartDate}
              />
              <FormDateField
                label={scheduleType === "semanal" ? "Hasta" : "Fecha de fin"}
                value={endDate}
                onChangeText={setEndDate}
              />
            </>
          )}

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
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 6,
  },
  sublabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  componentsList: {
    gap: 12,
    marginBottom: 18,
  },
  componentGroup: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  componentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  componentTypeLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  noneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  noneBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  componentChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  componentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: colors.card,
  },
  componentChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  componentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  componentIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  componentInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
  },
  componentAddButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  componentInputActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  componentCancelButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  componentCancelButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  componentSaveButton: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 38,
    borderRadius: 10,
  },
  componentSaveButtonText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  suggestionsRow: {
    marginTop: -2,
  },
  suggestionsRowContent: {
    gap: 6,
    paddingRight: 4,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.card,
  },
  suggestionChipText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  tagInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
  },
  tagAddButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FB8C00",
    alignItems: "center",
    justifyContent: "center",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF1DC",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B0793A",
  },
  scheduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  scheduleChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  scheduleChipActive: {
    backgroundColor: "#FB8C00",
    borderColor: "#FB8C00",
  },
  scheduleChipText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  scheduleChipTextActive: {
    color: "#FFFFFF",
  },
  weekdaysRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  weekdayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  weekdayChipActive: {
    backgroundColor: "#FB8C00",
    borderColor: "#FB8C00",
  },
  weekdayChipText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  weekdayChipTextActive: {
    color: "#FFFFFF",
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
