import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import CategoryService, { Category } from "../../services/category.service";
import MenuService, {
  Menu,
  MenuScheduleType,
  MenuStatus,
  getMenuComponents,
} from "../../services/menu.service";
import { AppAlert } from "../components/common/AppAlert";
import { Toast } from "../components/common/Toast";
import SheetOverlay from "../components/common/SheetOverlay";
import SuccessCelebrationModal from "../components/common/SuccessCelebrationModal";
import EntityListCard from "../components/restaurant/EntityListCard";
import FilterChips, { FilterChipOption } from "../components/restaurant/FilterChips";
import FormCategoryPicker from "../components/restaurant/FormCategoryPicker";
import FormDateField from "../components/restaurant/FormDateField";
import FormImagePicker from "../components/restaurant/FormImagePicker";
import FormTextField from "../components/restaurant/FormTextField";
import FormToggleRow from "../components/restaurant/FormToggleRow";
import RestaurantBottomNav from "../components/restaurant/RestaurantBottomNav";
import ScreenHeader from "../components/restaurant/ScreenHeader";
import { StatusTone } from "../components/restaurant/StatusBadge";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";
import { isValidPriceInput, parsePriceInput } from "../../utils/price";

const headerImage = require("../../assets/dashboard/menus.png");

const DESCRIPTION_MAX = 500; // @MaxLength(500) en CreateMenuDto
const TAG_MAX_LENGTH = 40;
const MAX_TAGS = 15;

type FilterValue = "todos" | MenuStatus;

const FILTERS: FilterChipOption<FilterValue>[] = [
  { value: "todos", label: "Todos", activeColor: "#FB8C00" },
  { value: "programado", label: "Programados", activeColor: "#1E88E5" },
  { value: "publicado", label: "Publicados", activeColor: "#43A047" },
  { value: "agotado", label: "Agotados", activeColor: "#E53935" },
  { value: "oculto", label: "Ocultos", activeColor: "#9E9E9E" },
];

const STATUS_META: Record<MenuStatus, { label: string; tone: StatusTone }> = {
  programado: { label: "Programado", tone: "info" },
  publicado: { label: "Publicado", tone: "success" },
  oculto: { label: "Oculto", tone: "neutral" },
  agotado: { label: "Agotado", tone: "danger" },
};

// Tipos de menú fijos -- el restaurante no crea ni agrega otros: son
// estos 5, siempre presentes. Un menú "compuesto" puede tener presencia
// en varios a la vez (ej. incluye entrada Y postre) -- ver
// componente_* en menus_del_dia (back) / MenuComponents (front). Ya no
// se agrupa por coleccion_id: eso solo podía representar "1 menú = 1
// tipo", y acá un mismo menú puede pertenecer a varios tipos.
type ComponentKey = "entrada" | "sopa" | "platoFuerte" | "jugo" | "postre";

interface FixedMenuTypeMeta {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  componentKey: ComponentKey;
}

const FIXED_MENU_TYPES = ["Entradas", "Sopas", "Plato Fuerte", "Jugo", "Postre"] as const;

// Toda la gama en naranjas/ámbar (nada de rojos) para que combine con
// la marca y cada tipo se distinga sin desentonar.
const FIXED_MENU_TYPE_META: Record<string, FixedMenuTypeMeta> = {
  Entradas: { icon: "restaurant-outline", color: "#FB8C00", componentKey: "entrada" },
  Sopas: { icon: "nutrition-outline", color: "#FFA726", componentKey: "sopa" },
  "Plato Fuerte": { icon: "fast-food-outline", color: "#F57C00", componentKey: "platoFuerte" },
  Jugo: { icon: "cafe-outline", color: "#FFCA28", componentKey: "jugo" },
  Postre: { icon: "ice-cream-outline", color: "#FFB300", componentKey: "postre" },
};

// "Entradas: Ensalada, Sopa de fideo · Postre: Flan" -- resumen de TODOS
// los tipos que tiene un menú (no solo uno), para la card de la lista
// principal.
function getFullComponentSummary(menu: Menu): string | undefined {
  const comps = getMenuComponents(menu);
  const parts = FIXED_MENU_TYPES.map((typeName) => {
    const meta = FIXED_MENU_TYPE_META[typeName];
    const names = comps[meta.componentKey];
    return names.length > 0 ? `${typeName}: ${names.join(", ")}` : null;
  }).filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

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

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const EMPTY_COMPONENTES: Record<ComponentKey, string[]> = {
  entrada: [],
  sopa: [],
  platoFuerte: [],
  jugo: [],
  postre: [],
};

const EMPTY_COMPONENT_DRAFTS: Record<ComponentKey, string> = {
  entrada: "",
  sopa: "",
  platoFuerte: "",
  jugo: "",
  postre: "",
};

const EMPTY_INLINE_FORM = {
  imageUri: null as string | null,
  name: "",
  description: "",
  price: "",
  categoryId: null as string | null,
  // Cada tipo admite VARIOS nombres -- ej. el restaurante ofrece dos
  // entradas distintas ese día. El texto que se está escribiendo antes
  // de "agregar" vive aparte, en componentDrafts (no acá).
  componentes: EMPTY_COMPONENTES,
  tags: [] as string[],
  tagInput: "",
  scheduleType: "fecha" as MenuScheduleType,
  startDate: "",
  endDate: "",
  diasSemana: [] as number[],
  publishOnSave: true,
};

export default function MenuListScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // "Menús de hoy": modo en el que cada card se vuelve un checkbox para
  // elegir -- sin re-escribir nada -- cuáles de los menús ya creados se
  // muestran hoy. Al guardar, esos quedan publicados (vigentes hoy) y los
  // que estaban como menú de hoy y se destildaron quedan ocultos.
  const [todaySelectMode, setTodaySelectMode] = useState(false);
  const [selectedToday, setSelectedToday] = useState<Set<string>>(new Set());
  const [applyingToday, setApplyingToday] = useState(false);

  // Categorías del restaurante (categoriaId sigue siendo obligatorio por
  // menú). Se cargan una sola vez para no repetir el aviso de "Sin
  // categorías" cada vez que la pantalla vuelve a tener foco.
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Ventana emergente de "nuevo menú": un solo formulario, sin importar
  // qué tipo abrió el "+" (formOpen), que arma un menú "compuesto" con
  // hasta 5 platos (uno por tipo fijo).
  const [formOpen, setFormOpen] = useState(false);
  // Cuál de los 5 tipos tiene su input de "agregar" desplegado ahora --
  // solo uno a la vez. Tocar el "+" de un tipo abre SU input nada más
  // (no los 5 juntos); Guardar/Cancelar lo vuelve a cerrar.
  const [openComponentType, setOpenComponentType] = useState<ComponentKey | null>(null);
  const [inlineForm, setInlineForm] = useState(EMPTY_INLINE_FORM);
  // Texto que se está tipeando en el input de cada tipo ANTES de
  // agregarlo a la lista (inlineForm.componentes ya guarda solo los
  // nombres confirmados).
  const [componentDrafts, setComponentDrafts] = useState(EMPTY_COMPONENT_DRAFTS);
  const [savingMenu, setSavingMenu] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sugerencias por tipo: todo lo que el restaurante ya haya escrito
  // antes en cada uno de los 5 componentes, sacado de sus propios menús
  // existentes -- sin límite de cuántas se acumulen. Así no hay que
  // re-tipear "Ensalada" cada vez que se arma un menú nuevo.
  const componentHistory = useMemo<Record<ComponentKey, string[]>>(() => {
    const history: Record<ComponentKey, Set<string>> = {
      entrada: new Set(),
      sopa: new Set(),
      platoFuerte: new Set(),
      jugo: new Set(),
      postre: new Set(),
    };
    for (const menu of menus) {
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
  }, [menus]);

  // Se recarga al enfocar -- así al volver de "Añadir más categorías"
  // (desde el picker del form) las nuevas ya aparecen.
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

  async function loadMenus() {
    try {
      const data = await MenuService.getAll();
      setMenus(data);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudieron cargar los menús.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadMenus();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadMenus();
  }

  function handleDelete(id: string) {
    AppAlert.alert("Eliminar menú", "¿Seguro que quieres eliminar este menú?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await MenuService.remove(id);
            setMenus((prev) => prev.filter((m) => m.id !== id));
            Toast.success("Menú eliminado");
          } catch (e: any) {
            AppAlert.alert("Error", e.message || "No se pudo eliminar el menú.");
          }
        },
      },
    ]);
  }

  async function handleToggleVisibility(menu: Menu) {
    try {
      const result = await MenuService.toggle(menu.id);
      setMenus((prev) =>
        prev.map((m) => (m.id === menu.id ? { ...m, estado: result.estado } : m))
      );
      Toast.success(result.estado === "publicado" ? "Menú publicado" : "Menú oculto");
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar el menú.");
    }
  }

  // Distinto del toggle de arriba (que solo alterna publicado<->oculto):
  // "sin stock" se setea directo con el estado puntual "agotado", vía
  // el PATCH normal del menú (no el endpoint /toggle).
  async function handleToggleStock(menu: Menu) {
    try {
      const nextEstado = menu.estado === "agotado" ? "publicado" : "agotado";
      const updated = await MenuService.update(menu.id, { estado: nextEstado });
      setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, estado: updated.estado } : m)));
      Toast.success(updated.estado === "agotado" ? "Menú marcado como agotado" : "Menú disponible de nuevo");
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar el stock del menú.");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await MenuService.duplicate(id);
      loadMenus();
      AppAlert.alert(
        "Menú duplicado",
        "Creamos una copia oculta. Edítala y publícala cuando quieras."
      );
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo duplicar el menú.");
    }
  }

  // ------- Menús de hoy (selección con checkbox) -------

  function startTodaySelect() {
    setSelectedToday(new Set(menus.filter((m) => m.estado === "publicado").map((m) => m.id)));
    setTodaySelectMode(true);
  }

  function toggleTodayItem(id: string) {
    setSelectedToday((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyTodaySelection() {
    setApplyingToday(true);
    try {
      const updated = await MenuService.setTodayMenus(Array.from(selectedToday));
      setMenus(updated);
      setTodaySelectMode(false);
      AppAlert.alert("Listo", "Actualizamos los menús que se muestran hoy.");
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo actualizar la selección.");
    } finally {
      setApplyingToday(false);
    }
  }

  // ------- Ventana emergente: nuevo menú -------

  function openNewMenu(typeName: string) {
    setInlineForm(EMPTY_INLINE_FORM);
    setComponentDrafts(EMPTY_COMPONENT_DRAFTS);
    setOpenComponentType(FIXED_MENU_TYPE_META[typeName]?.componentKey ?? null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setInlineForm(EMPTY_INLINE_FORM);
    setComponentDrafts(EMPTY_COMPONENT_DRAFTS);
    setOpenComponentType(null);
  }

  const isDirty =
    inlineForm.name.trim() !== "" ||
    inlineForm.description.trim() !== "" ||
    inlineForm.price.trim() !== "" ||
    inlineForm.imageUri !== null ||
    inlineForm.tags.length > 0 ||
    Object.values(inlineForm.componentes).some((arr) => arr.length > 0);

  function handleCancelPress() {
    if (!isDirty) {
      closeForm();
      return;
    }
    AppAlert.alert(
      "¿Descartar cambios?",
      "Vas a perder lo que escribiste para este menú.",
      [
        { text: "Seguir editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: closeForm },
      ]
    );
  }

  // "Añadir más categorías" desde el picker: este form vive en un Modal,
  // así que hay que cerrarlo antes de navegar (un Modal de RN queda
  // siempre por encima de la pantalla nueva). Al volver, la lista de
  // categorías se refresca sola (useFocusEffect de arriba).
  function handleAddMoreCategories() {
    const go = () => {
      closeForm();
      router.push("/(restaurant)/elegir-categorias?from=form");
    };
    if (!isDirty) {
      go();
      return;
    }
    AppAlert.alert(
      "Ir a categorías",
      "Vas a salir de este menú para elegir categorías y se perderá lo que cargaste.",
      [
        { text: "Seguir acá", style: "cancel" },
        { text: "Ir a categorías", style: "destructive", onPress: go },
      ]
    );
  }

  function setComponentDraft(key: ComponentKey, value: string) {
    setComponentDrafts((d) => ({ ...d, [key]: value }));
  }

  // Tocar el "+" de un tipo abre SU input nada más -- cierra cualquier
  // otro que hubiera quedado abierto (solo uno a la vez).
  function openComponentInput(key: ComponentKey) {
    setOpenComponentType(key);
    setComponentDrafts((d) => ({ ...d, [key]: "" }));
  }

  // "Cancelar": cierra el input sin agregar lo que se haya tipeado.
  function cancelComponentInput() {
    if (!openComponentType) return;
    setComponentDrafts((d) => ({ ...d, [openComponentType]: "" }));
    setOpenComponentType(null);
  }

  // "Guardar" (o tocar una sugerencia): agrega el nombre a la lista de
  // ese tipo -- sin duplicados -- y cierra el input. Vacío = "Ninguno",
  // no hace falta escribir nada para cerrar.
  function saveComponentEntry(key: ComponentKey, valueOverride?: string) {
    const value = (valueOverride ?? componentDrafts[key]).trim();
    if (value) {
      setInlineForm((f) =>
        f.componentes[key].includes(value)
          ? f
          : { ...f, componentes: { ...f.componentes, [key]: [...f.componentes[key], value] } }
      );
    }
    setComponentDrafts((d) => ({ ...d, [key]: "" }));
    setOpenComponentType(null);
  }

  function removeComponentEntry(key: ComponentKey, value: string) {
    setInlineForm((f) => ({
      ...f,
      componentes: { ...f.componentes, [key]: f.componentes[key].filter((v) => v !== value) },
    }));
  }

  function addTag() {
    const value = inlineForm.tagInput.trim();
    if (!value) return;
    setInlineForm((f) => {
      if (f.tags.length >= MAX_TAGS || f.tags.includes(value)) {
        return { ...f, tagInput: "" };
      }
      return { ...f, tags: [...f.tags, value], tagInput: "" };
    });
  }

  function removeTag(tag: string) {
    setInlineForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function toggleWeekday(day: number) {
    setInlineForm((f) => ({
      ...f,
      diasSemana: f.diasSemana.includes(day)
        ? f.diasSemana.filter((d) => d !== day)
        : [...f.diasSemana, day].sort(),
    }));
  }

  function validateMenu() {
    if (!inlineForm.name.trim()) {
      AppAlert.alert("Falta el nombre", "Ingresa el nombre del menú.");
      return false;
    }
    if (!isValidPriceInput(inlineForm.price, { allowZero: false })) {
      AppAlert.alert("Precio inválido", "Ingresa un precio válido. Puedes usar coma o punto (ej. 12,50 o 12.50).");
      return false;
    }
    if (!inlineForm.categoryId) {
      AppAlert.alert("Falta la categoría", "Elige una categoría para el menú.");
      return false;
    }
    const hasAnyComponent = Object.values(inlineForm.componentes).some((arr) => arr.length > 0);
    if (!hasAnyComponent) {
      AppAlert.alert(
        "Falta al menos un plato",
        "Completa el nombre de al menos uno de los 5 tipos (Entrada, Sopa, Plato Fuerte, Jugo o Postre). El resto puede quedar en \"Ninguno\"."
      );
      return false;
    }
    if (inlineForm.scheduleType === "fecha") {
      if (!inlineForm.startDate.trim() || !inlineForm.endDate.trim()) {
        AppAlert.alert("Faltan fechas", "Ingresa la fecha de inicio y fin del menú.");
        return false;
      }
    }
    if (inlineForm.scheduleType === "semanal") {
      if (inlineForm.diasSemana.length === 0) {
        AppAlert.alert("Faltan días", "Elige al menos un día de la semana.");
        return false;
      }
      if (!inlineForm.startDate.trim() || !inlineForm.endDate.trim()) {
        AppAlert.alert("Faltan fechas", "Ingresa desde y hasta cuándo se repite este menú.");
        return false;
      }
    }
    return true;
  }

  async function handleSaveMenu() {
    if (!validateMenu()) return;
    setSavingMenu(true);
    try {
      let fechaInicio: string;
      let fechaFin: string;
      if (inlineForm.scheduleType === "hoy") {
        fechaInicio = todayIsoDate();
        fechaFin = todayIsoDate();
      } else {
        fechaInicio = inlineForm.startDate.trim();
        fechaFin = inlineForm.endDate.trim();
      }

      const savedMenu = await MenuService.create({
        nombre: inlineForm.name.trim(),
        descripcion: inlineForm.description.trim() || undefined,
        precio: parsePriceInput(inlineForm.price),
        fechaInicio,
        fechaFin,
        categoriaId: inlineForm.categoryId!,
        imageUri: inlineForm.imageUri,
        componenteEntrada: inlineForm.componentes.entrada,
        componenteSopa: inlineForm.componentes.sopa,
        componentePlatoFuerte: inlineForm.componentes.platoFuerte,
        componenteJugo: inlineForm.componentes.jugo,
        componentePostre: inlineForm.componentes.postre,
        tags: inlineForm.tags,
        tipoProgramacion: inlineForm.scheduleType,
        diasSemana: inlineForm.scheduleType === "semanal" ? inlineForm.diasSemana : undefined,
      });

      // El create no acepta "estado" (el back siempre lo deja en
      // "programado"). Si el switch pide que quede publicado, se
      // resuelve con un toggle aparte -- en su propio try/catch: el
      // menú YA se guardó, así que si esto falla no corresponde
      // mostrar "Error" como si no se hubiera guardado nada.
      if (inlineForm.publishOnSave && savedMenu.estado !== "publicado") {
        try {
          await MenuService.toggle(savedMenu.id);
        } catch (toggleError: any) {
          console.log("Menú guardado, pero falló el toggle de estado:", toggleError);
          AppAlert.alert(
            "Menú guardado",
            "Se guardó correctamente, pero no se pudo publicar. Puedes cambiarlo desde la lista con el ícono del ojo."
          );
        }
      }

      closeForm();
      loadMenus();
      setShowSuccess(true);
    } catch (e: any) {
      AppAlert.alert("Error", e.message || "No se pudo guardar el menú.");
      // Si el server tardó/cortó la respuesta, el menú igual pudo haberse
      // creado (el back ignora el POST duplicado dentro de ~1 min). Se
      // refresca la lista para que refleje el estado real y el usuario
      // vea si ya quedó guardado antes de reintentar.
      loadMenus();
    } finally {
      setSavingMenu(false);
    }
  }

  const filteredMenus = filter === "todos" ? menus : menus.filter((m) => m.estado === filter);
  // En modo "elegir los de hoy" se ven TODOS los menús (sin importar el
  // filtro de estado) -- si no, no podrías tildar uno que está oculto.
  const listData = todaySelectMode ? menus : filteredMenus;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Menú del día"
        showBack
        imageSource={headerImage}
        rightIcon="add"
        onRightPress={() => openNewMenu(FIXED_MENU_TYPES[0])}
      />
      {!todaySelectMode && (
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#FB8C00" style={styles.loader} />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />
          }
        >
          {/* ------- Menús guardados / "elegir los de hoy" ------- */}
          <View style={styles.todayBar}>
            <View style={styles.todayBarText}>
              <Text style={styles.todayBarTitle}>
                {todaySelectMode ? "Elige los menús de hoy" : "Mis menús guardados"}
              </Text>
              <Text style={styles.todayBarSub}>
                {todaySelectMode
                  ? `${selectedToday.size} seleccionado${selectedToday.size === 1 ? "" : "s"} · toca una card para marcarla`
                  : "Reutiliza los que ya creaste sin volver a escribirlos."}
              </Text>
            </View>
            {todaySelectMode ? (
              <View style={styles.todayBarActions}>
                <TouchableOpacity
                  style={styles.todayGhostButton}
                  onPress={() => setTodaySelectMode(false)}
                  disabled={applyingToday}
                >
                  <Text style={styles.todayGhostButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.todayPrimaryButton}
                  onPress={applyTodaySelection}
                  disabled={applyingToday}
                >
                  <Text style={styles.todayPrimaryButtonText}>
                    {applyingToday ? "Guardando..." : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.todayPrimaryButton}
                onPress={startTodaySelect}
                disabled={menus.length === 0}
              >
                <Ionicons name="checkbox-outline" size={16} color="#FFFFFF" />
                <Text style={styles.todayPrimaryButtonText}>Elegir hoy</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ------- Cards de cada menú ------- */}
          {listData.length === 0 ? (
            <Text style={styles.emptyListText}>
              {filter === "todos" || todaySelectMode
                ? "Todavía no creaste ningún menú."
                : "No hay menús con este estado."}
            </Text>
          ) : (
            listData.map((item) => (
              <EntityListCard
                key={item.id}
                imageUri={item.foto_url}
                title={item.nombre}
                subtitle={getFullComponentSummary(item)}
                highlight={`$${Number(item.precio).toFixed(2)}`}
                statusLabel={STATUS_META[item.estado].label}
                statusTone={STATUS_META[item.estado].tone}
                isHidden={item.estado === "oculto"}
                selectable={todaySelectMode}
                selected={selectedToday.has(item.id)}
                onToggleSelected={() => toggleTodayItem(item.id)}
                onPress={() =>
                  router.push({ pathname: "/(restaurant)/menu/[id]", params: { id: item.id.toString() } })
                }
                onEdit={() => router.push(`/(restaurant)/menu/form?id=${item.id}`)}
                onDelete={() => handleDelete(item.id)}
                onDuplicate={() => handleDuplicate(item.id)}
                onToggleVisibility={() => handleToggleVisibility(item)}
                onToggleStock={() => handleToggleStock(item)}
                isOutOfStock={item.estado === "agotado"}
              />
            ))
          )}
        </ScrollView>
      )}

      <RestaurantBottomNav />

      {/* Hoja para completar un menú nuevo. Va como overlay en el mismo
          árbol (no <Modal>): así el selector de foto de FormImagePicker no
          se lanza desde una ventana nativa aparte -- en Android viejo eso
          dejaba la hoja sin responder al volver de la galería. */}
      <SheetOverlay visible={formOpen} onRequestClose={handleCancelPress}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetKeyboardWrap}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Nuevo menú</Text>
                <TouchableOpacity onPress={handleCancelPress} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.placeholder} />
                </TouchableOpacity>
              </View>

              {/* KeyboardAwareScrollView (no un ScrollView + KeyboardAvoidingView
                  a mano) -- se encarga sola de scrollear hasta el input que
                  tiene el foco cuando el teclado lo tapa, que es justo el
                  problema que había: al tocar "+" de un tipo más abajo (ej.
                  Postre), el input + Guardar/Cancelar podían quedar debajo
                  del teclado sin forma de scrollear hasta ahí. */}
              <KeyboardAwareScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bottomOffset={24}
              >
                {/* ------- Componentes: uno por vez, tocando su "+" ------- */}
                <Text style={styles.label}>¿Qué incluye este menú?</Text>
                <Text style={styles.sublabel}>
                  Toca el "+" de cada tipo para registrar un nombre (puedes cargar cuantos
                  quieras). Si lo dejas vacío, cuenta como "Ninguno".
                </Text>
                <View style={styles.componentsList}>
                  {FIXED_MENU_TYPES.map((typeName) => {
                    const meta = FIXED_MENU_TYPE_META[typeName];
                    const entries = inlineForm.componentes[meta.componentKey];
                    const isOpen = openComponentType === meta.componentKey;
                    const suggestions = componentHistory[meta.componentKey].filter(
                      (s) => !entries.includes(s)
                    );
                    return (
                      <View key={typeName} style={styles.componentGroup}>
                        <View style={styles.componentHeaderRow}>
                          <View style={[styles.componentIcon, { backgroundColor: `${meta.color}1A` }]}>
                            <Ionicons name={meta.icon} size={16} color={meta.color} />
                          </View>
                          <Text style={styles.componentTypeLabel}>{typeName}</Text>
                          {entries.length === 0 && !isOpen && (
                            <View style={styles.noneBadge}>
                              <Text style={styles.noneBadgeText}>Ninguno</Text>
                            </View>
                          )}
                          {!isOpen && (
                            <TouchableOpacity
                              style={[styles.componentAddButton, { backgroundColor: meta.color }]}
                              onPress={() => openComponentInput(meta.componentKey)}
                              hitSlop={6}
                            >
                              <Ionicons name="add" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Nombres ya registrados para este tipo -- tocar
                            uno lo saca de la lista. */}
                        {entries.length > 0 && (
                          <View style={styles.componentChipsWrap}>
                            {entries.map((name) => (
                              <TouchableOpacity
                                key={name}
                                style={[styles.componentChip, { borderColor: `${meta.color}40` }]}
                                onPress={() => removeComponentEntry(meta.componentKey, name)}
                              >
                                <Text style={[styles.componentChipText, { color: meta.color }]}>
                                  {name}
                                </Text>
                                <Ionicons name="close" size={13} color={meta.color} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {/* Input de "registrar [tipo]" -- solo el de ESTE
                            tipo, no los 5 juntos. Aparece nada más al
                            tocar el "+" de arriba. */}
                        {isOpen && (
                          <>
                            <View style={styles.componentRow}>
                              <TextInput
                                autoFocus
                                style={styles.componentInput}
                                placeholder={`Registrar ${typeName.toLowerCase().replace(/s$/, "")}...`}
                                placeholderTextColor={colors.placeholder}
                                value={componentDrafts[meta.componentKey]}
                                onChangeText={(v) => setComponentDraft(meta.componentKey, v)}
                                onSubmitEditing={() => saveComponentEntry(meta.componentKey)}
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
                                style={[styles.componentSaveButton, { backgroundColor: meta.color }]}
                                onPress={() => saveComponentEntry(meta.componentKey)}
                              >
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                <Text style={styles.componentSaveButtonText}>Guardar</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Sugerencias: nombres que ya usaste antes
                                para este tipo, en otros menús -- tocar
                                una la agrega directo. */}
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
                                    style={[styles.suggestionChip, { borderColor: `${meta.color}40` }]}
                                    onPress={() => saveComponentEntry(meta.componentKey, suggestion)}
                                  >
                                    <Ionicons name="checkbox-outline" size={13} color={meta.color} />
                                    <Text style={[styles.suggestionChipText, { color: meta.color }]}>
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
                  imageUri={inlineForm.imageUri}
                  onChange={(uri) => setInlineForm((f) => ({ ...f, imageUri: uri }))}
                  label="Subir foto del menú (opcional)"
                  allowPresets
                  presetCategory={
                    categories.find((c) => c.id === inlineForm.categoryId)?.nombre ?? null
                  }
                />

                <FormTextField
                  label="Nombre del menú"
                  placeholder="Ej: Guarniciones de papa con jugo"
                  value={inlineForm.name}
                  onChangeText={(v) => setInlineForm((f) => ({ ...f, name: v }))}
                  icon="restaurant-outline"
                />

                <FormTextField
                  label="Descripción"
                  placeholder="Ej: Menú del día con entrada, plato fuerte y jugo natural"
                  value={inlineForm.description}
                  onChangeText={(v) => setInlineForm((f) => ({ ...f, description: v }))}
                  multiline
                  maxLength={DESCRIPTION_MAX}
                />

                <FormTextField
                  label="Precio"
                  placeholder="Ingresa el precio del menú"
                  value={inlineForm.price}
                  onChangeText={(v) => setInlineForm((f) => ({ ...f, price: v }))}
                  icon="pricetag-outline"
                  keyboardType="decimal-pad"
                />

                <FormCategoryPicker
                  label="Categoría"
                  categories={categories}
                  value={inlineForm.categoryId}
                  onChange={(v) => setInlineForm((f) => ({ ...f, categoryId: v }))}
                  loading={categoriesLoading}
                  onAddMoreCategories={handleAddMoreCategories}
                />

                {/* ------- Palabras clave (chips) ------- */}
                <Text style={styles.label}>Palabras clave</Text>
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Ej: picante, vegetariano..."
                    placeholderTextColor={colors.placeholder}
                    value={inlineForm.tagInput}
                    onChangeText={(v) => setInlineForm((f) => ({ ...f, tagInput: v }))}
                    onSubmitEditing={addTag}
                    maxLength={TAG_MAX_LENGTH}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.tagAddButton} onPress={addTag}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                {inlineForm.tags.length > 0 && (
                  <View style={styles.tagsWrap}>
                    {inlineForm.tags.map((tag) => (
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
                    const active = inlineForm.scheduleType === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.scheduleChip, active && styles.scheduleChipActive]}
                        onPress={() =>
                          setInlineForm((f) => ({
                            ...f,
                            scheduleType: opt.value,
                            // Ventana por defecto razonable al pasar a
                            // fecha/semanal, si todavía no eligieron nada.
                            startDate: f.startDate || todayIsoDate(),
                            endDate:
                              f.endDate || (opt.value === "semanal" ? addDaysIso(90) : todayIsoDate()),
                          }))
                        }
                      >
                        <Text style={[styles.scheduleChipText, active && styles.scheduleChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {inlineForm.scheduleType === "semanal" && (
                  <View style={styles.weekdaysRow}>
                    {WEEKDAYS.map((day) => {
                      const active = inlineForm.diasSemana.includes(day.value);
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

                {(inlineForm.scheduleType === "fecha" || inlineForm.scheduleType === "semanal") && (
                  <>
                    <FormDateField
                      label={inlineForm.scheduleType === "semanal" ? "Se repite desde" : "Fecha de inicio"}
                      value={inlineForm.startDate}
                      onChangeText={(v) => setInlineForm((f) => ({ ...f, startDate: v }))}
                    />
                    <FormDateField
                      label={inlineForm.scheduleType === "semanal" ? "Hasta" : "Fecha de fin"}
                      value={inlineForm.endDate}
                      onChangeText={(v) => setInlineForm((f) => ({ ...f, endDate: v }))}
                    />
                  </>
                )}

                <FormToggleRow
                  label="Publicar al guardar"
                  value={inlineForm.publishOnSave}
                  onValueChange={(v) => setInlineForm((f) => ({ ...f, publishOnSave: v }))}
                />

                <View style={styles.formActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelPress}
                    disabled={savingMenu}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButtonWrap}
                    onPress={handleSaveMenu}
                    disabled={savingMenu}
                  >
                    <LinearGradient
                      colors={["#FFB74D", "#FB8C00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>
                        {savingMenu ? "Guardando..." : "Guardar menú"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </KeyboardAwareScrollView>
            </View>
          </View>
        </View>
      </SheetOverlay>

      <SuccessCelebrationModal
        visible={showSuccess}
        title="¡Menú publicado!"
        message="Tu menú ya está listo para que lo vean tus clientes."
        onClose={() => setShowSuccess(false)}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },

  emptyListText: {
    textAlign: "center",
    color: colors.placeholder,
    fontSize: 13,
    paddingVertical: 24,
  },

  todayBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayBarText: {
    flex: 1,
    minWidth: 0,
  },
  todayBarTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  todayBarSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  todayBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todayPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FB8C00",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  todayPrimaryButtonText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  todayGhostButton: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surfaceSecondary,
  },
  todayGhostButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  section: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  sectionHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  typeChip: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  typeChipText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  countBadge: {
    borderRadius: 9,
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  emptySectionText: {
    fontSize: 12.5,
    color: colors.placeholder,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  // ------- Ventana emergente: nuevo menú -------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 15, 10, 0.5)",
    justifyContent: "flex-end",
  },
  sheetKeyboardWrap: {
    maxHeight: "90%",
    flexShrink: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  sheet: {
    flexShrink: 1,
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  sheetScroll: {
    flexShrink: 1,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 16.5,
    fontWeight: "800",
    color: colors.text,
    marginRight: 10,
  },
  sheetContent: {
    paddingBottom: 32,
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
  // Un contenedor por tipo (Entrada/Sopa/etc.) -- agrupa el header, los
  // nombres ya agregados y el input de "agregar uno más" para que se
  // lea como una sola unidad, sobre todo ahora que cada tipo puede
  // acumular varios nombres.
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

  formActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  saveButtonWrap: {
    flex: 1.4,
    borderRadius: 26,
    overflow: "hidden",
  },
  saveButtonGradient: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
