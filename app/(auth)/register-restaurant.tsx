import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView, KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import LocationService, { City } from '../../services/location.service';
import ProvinceService, { Province } from '../../services/province.service';
import RestaurantLocationPickerBridge from '../../services/restaurantLocationPicker.bridge';
import RestaurantDraftStore, {
  DRAFT_FRESH_MS,
  RestaurantDraftData,
} from '../../services/restaurantDraft.store';
import { RestaurantSchedule } from '../../services/restaurant.service';
import { AppAlert } from "../components/common/AppAlert";
import { pickImageFromCamera, pickImageFromLibrary } from "../../utils/imagePicker";
import ScheduleEditor from "../components/profile/ScheduleEditor";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

interface CountryCode {
  code: string; // ISO
  name: string;
  dialCode: string;
  flag: string;
}

// Códigos de país más comunes para la región + algunos internacionales.
// TODO: ampliar/ordenar según los países donde tengan usuarios reales.
const COUNTRY_CODES: CountryCode[] = [
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { code: 'DO', name: 'República Dominicana', dialCode: '+1', flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
];

// day: 1 = Lunes ... 7 = Domingo (coincide con ScheduleDto del backend)
const DAYS_OF_WEEK = [
  { day: 1, label: 'Lunes' },
  { day: 2, label: 'Martes' },
  { day: 3, label: 'Miércoles' },
  { day: 4, label: 'Jueves' },
  { day: 5, label: 'Viernes' },
  { day: 6, label: 'Sábado' },
  { day: 7, label: 'Domingo' },
];

interface ScheduleDayState {
  day: number;
  closed: boolean;
  openingHour: string;
  closingHour: string;
}

const HOUR_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Convierte lo que el usuario tipeó (handle suelto o link completo) en una
// URL utilizable. Si ya viene con http(s) la dejamos tal cual.
function normalizeSocialUrl(platform: 'instagram' | 'facebook' | 'tiktok', value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const handle = trimmed.replace(/^@/, '');
  if (platform === 'instagram') return `https://instagram.com/${handle}`;
  if (platform === 'tiktok') return `https://tiktok.com/@${handle}`;
  return `https://facebook.com/${handle}`;
}

export default function RegisterRestaurantScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [logo, setLogo] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [province, setProvince] = useState<Province | null>(null);
  const [city, setCity] = useState<City | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [provincePickerVisible, setProvincePickerVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES[0] // Ecuador por defecto
  );
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [description, setDescription] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleDayState[]>(
    DAYS_OF_WEEK.map((d) => ({ day: d.day, closed: true, openingHour: '', closingHour: '' }))
  );

  const DESCRIPTION_MAX = 200;

  // --- Borrador anti-reinicio -------------------------------------------
  // La cámara/galería abre una Activity aparte y Android puede matar el
  // proceso de la app mientras está abierta. Guardamos el formulario en
  // cada cambio y lo rehidratamos al volver, así no se pierde nada aunque
  // la app se reinicie (ver services/restaurantDraft.store.ts y splash).
  const hydratedRef = useRef(false);

  const buildDraft = useCallback((): RestaurantDraftData => ({
    logo,
    restaurantName,
    province: province ? { id: province.id, nombre: province.nombre } : null,
    city: city ? { id: city.id, nombre: city.nombre } : null,
    location,
    phone,
    countryCode: selectedCountry.code,
    description,
    instagram,
    facebook,
    tiktok,
    idFront,
    idBack,
    schedules: schedules.map((s) => ({
      day: s.day,
      closed: s.closed,
      openingHour: s.openingHour,
      closingHour: s.closingHour,
    })),
  }), [
    logo, restaurantName, province, city, location, phone, selectedCountry,
    description, instagram, facebook, tiktok, idFront, idBack, schedules,
  ]);

  const saveDraftNow = useCallback((): Promise<void> => {
    if (!hydratedRef.current) return Promise.resolve();
    return RestaurantDraftStore.save(buildDraft());
  }, [buildDraft]);

  useEffect(() => {
    ProvinceService.getAll().then(setProvinces);

    (async () => {
      const stored = await RestaurantDraftStore.load();
      // Solo se rehidrata un borrador RECIENTE (interrupción real). Uno
      // viejo se descarta -- las URIs de las fotos ya no serían válidas y
      // el usuario seguramente quiere empezar de cero.
      const isFresh = stored && Date.now() - stored.updatedAt < DRAFT_FRESH_MS;
      if (stored && !isFresh) {
        RestaurantDraftStore.clear();
      }
      if (stored?.data && isFresh) {
        const d = stored.data;
        setLogo(d.logo);
        setRestaurantName(d.restaurantName);
        if (d.province) {
          setProvince(d.province as Province);
          LocationService.getCitiesByProvince(d.province.id)
            .then(setCities)
            .catch(() => setCities([]));
        }
        if (d.city) setCity(d.city as City);
        setLocation(d.location);
        setPhone(d.phone);
        const country = COUNTRY_CODES.find((c) => c.code === d.countryCode);
        if (country) setSelectedCountry(country);
        setDescription(d.description);
        setInstagram(d.instagram);
        setFacebook(d.facebook);
        setTiktok(d.tiktok);
        setIdFront(d.idFront);
        setIdBack(d.idBack);
        if (Array.isArray(d.schedules) && d.schedules.length === 7) {
          setSchedules(d.schedules);
        }
      }
      hydratedRef.current = true;
    })();
  }, []);

  // Autoguardado con debounce ante cualquier cambio del formulario.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const t = setTimeout(saveDraftNow, 600);
    return () => clearTimeout(t);
  }, [saveDraftNow]);

  async function handleSelectProvince(selected: Province) {
    setProvince(selected);
    setCity(null); // la ciudad depende de la provincia, se resetea
    setProvincePickerVisible(false);
    setProvinceSearch('');

    try {
      const data = await LocationService.getCitiesByProvince(selected.id);
      setCities(data);
    } catch (e) {
      console.log('Error cargando ciudades:', e);
      setCities([]);
    }
  }

  function handleSelectCity(selected: City) {
    setCity(selected);
    setCityPickerVisible(false);
    setCitySearch('');
  }

  function openCityPicker() {
    if (!province) return; // no se puede elegir ciudad sin provincia
    setCityPickerVisible(true);
  }

  const filteredProvinces = provinces.filter((p) =>
    p.nombre.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const filteredCities = cities.filter((c) =>
    c.nombre.toLowerCase().includes(citySearch.toLowerCase())
  );

  async function pickLogo() {
    // Guardamos el borrador ANTES de abrir la galería: si Android mata la
    // app mientras el selector está abierto, al volver se rehidrata todo.
    await saveDraftNow();
    // Sin `allowsEditing`: el recortador nativo de Android (barra inferior
    // negra con "Guardar/Cancelar") no combina con el diseño de MenuDays
    // -- ver mismo criterio en FormImagePicker/gallery. El logo se muestra
    // recortado al círculo igual (Image + overflow hidden).
    const picked = await pickImageFromLibrary();
    if (picked.ok && picked.asset) setLogo(picked.asset.uri);
  }

  async function pickDocument(side: 'front' | 'back') {
    await saveDraftNow();
    // El usuario elige cámara o galería: la galería es más liviana que la
    // cámara (menos chance de que Android mate la app por memoria).
    const source = await new Promise<'camera' | 'library' | null>((resolve) => {
      AppAlert.alert('Foto del documento', '¿Cómo querés agregarla?', [
        { text: 'Tomar foto', onPress: () => resolve('camera') },
        { text: 'Elegir de galería', onPress: () => resolve('library') },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
    if (!source) return;

    // quality 0.6: una cédula solo tiene que leerse -- una imagen más
    // liviana ocupa menos RAM (menos chance de que Android mate la app) y
    // sube más rápido.
    const picked =
      source === 'camera'
        ? await pickImageFromCamera({ quality: 0.6 })
        : await pickImageFromLibrary({ quality: 0.6 });
    if (!picked.ok || !picked.asset) return;
    if (side === 'front') setIdFront(picked.asset.uri);
    else setIdBack(picked.asset.uri);
  }

  // Adapta el shape local (day/closed/openingHour/closingHour, sin id
  // real porque el restaurante todavía no existe) al que espera
  // ScheduleEditor (RestaurantSchedule -- id/dia_semana/cerrado/
  // hora_apertura/hora_cierre), reusando el mismo editor de "elegir
  // días + completar una vez" que el de editar-perfil. Como id se
  // manda el propio número de día: alcanza para identificar la fila
  // dentro de este array de 7, no hace falta que sea un id real de DB.
  const scheduleForEditor: RestaurantSchedule[] = schedules.map((s) => ({
    id: s.day,
    dia_semana: s.day,
    hora_apertura: s.openingHour || null,
    hora_cierre: s.closingHour || null,
    cerrado: s.closed,
  }));

  function handleScheduleChange(dayId: number, patch: Partial<RestaurantSchedule>) {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.day !== dayId) return s;
        return {
          ...s,
          closed: patch.cerrado ?? s.closed,
          openingHour: patch.hora_apertura !== undefined ? patch.hora_apertura ?? '' : s.openingHour,
          closingHour: patch.hora_cierre !== undefined ? patch.hora_cierre ?? '' : s.closingHour,
        };
      })
    );
  }

  function pickLocationOnMap() {
    void saveDraftNow();
    router.push({
      pathname: '/(auth)/select-restaurant-location',
      params: {
        cityName: city?.nombre ?? '',
        provinceName: province?.nombre ?? '',
      },
    });
  }

  // Al volver de la pantalla del mapa, recogemos la ubicación elegida
  // (si la hay) desde el puente en memoria.
  useFocusEffect(
    useCallback(() => {
      const picked = RestaurantLocationPickerBridge.consume();
      if (picked) {
        setLocation(picked);
      }
    }, [])
  );

  const isDirty =
    !!logo ||
    restaurantName.trim() !== '' ||
    !!province ||
    !!city ||
    !!location ||
    phone.trim() !== '' ||
    description.trim() !== '' ||
    instagram.trim() !== '' ||
    facebook.trim() !== '' ||
    tiktok.trim() !== '' ||
    !!idFront ||
    !!idBack ||
    schedules.some((s) => !s.closed);

  // Salir del formulario (botón atrás). Si hay datos cargados, se
  // confirma antes de descartar el borrador -- así un toque accidental
  // en "atrás" no borra todo, y un reinicio de la app (que NO pasa por
  // acá) conserva el borrador para volver al formulario.
  function handleExit() {
    const leave = async () => {
      await RestaurantDraftStore.clear();
      router.replace('/(home)/(tabs)/perfil');
    };
    if (!isDirty) {
      void leave();
      return;
    }
    AppAlert.alert(
      '¿Descartar la solicitud?',
      'Se perderá lo que cargaste para registrar tu restaurante.',
      [
        { text: 'Seguir editando', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => void leave() },
      ]
    );
  }

  // Botón "atrás" físico de Android: mismo trato que el de la pantalla
  // (confirmar si hay datos) en vez de un pop directo que dejaría el
  // borrador colgado.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleExit();
        return true;
      });
      return () => sub.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDirty])
  );

  async function handleSubmit() {
    if (!restaurantName.trim() || !province || !city || !phone.trim()) {
      AppAlert.alert('Campos incompletos', 'Completa nombre, provincia, cantón y teléfono.');
      return;
    }

    if (!location) {
      AppAlert.alert('Ubicación requerida', 'Selecciona la ubicación del restaurante en el mapa.');
      return;
    }

    if (!logo) {
      AppAlert.alert('Logo requerido', 'Sube el logo de tu restaurante.');
      return;
    }

    if (!idFront || !idBack) {
      AppAlert.alert('Documentos requeridos', 'Sube el frente y el dorso de tu cédula.');
      return;
    }

    const openDays = schedules.filter((s) => !s.closed);
    if (openDays.length === 0) {
      AppAlert.alert('Horarios requeridos', 'Marca al menos un día en el que tu restaurante esté abierto.');
      return;
    }
    const invalidDay = openDays.find(
      (s) => !HOUR_REGEX.test(s.openingHour) || !HOUR_REGEX.test(s.closingHour)
    );
    if (invalidDay) {
      const label = DAYS_OF_WEEK.find((d) => d.day === invalidDay.day)?.label;
      AppAlert.alert(
        'Horario inválido',
        `Completa la hora de apertura y cierre de ${label} en formato HH:mm (ej: 08:00).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('commercialName', restaurantName.trim());
      formData.append('address', location.address);
      formData.append('provinceId', String(province.id));
      formData.append('cityId', String(city.id));
      formData.append('latitude', String(location.latitude));
      formData.append('longitude', String(location.longitude));
      formData.append('contactPhone', `${selectedCountry.dialCode}${phone.trim()}`);

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const socialNetworks: Record<string, string> = {};
      if (instagram.trim()) socialNetworks.instagram = normalizeSocialUrl('instagram', instagram);
      if (facebook.trim()) socialNetworks.facebook = normalizeSocialUrl('facebook', facebook);
      if (tiktok.trim()) socialNetworks.tiktok = normalizeSocialUrl('tiktok', tiktok);
      if (Object.keys(socialNetworks).length > 0) {
        formData.append('socialNetworks', JSON.stringify(socialNetworks));
      }

      const schedulesPayload = schedules.map((s) => ({
        day: s.day,
        closed: s.closed,
        openingHour: s.closed ? undefined : s.openingHour,
        closingHour: s.closed ? undefined : s.closingHour,
      }));
      formData.append('schedules', JSON.stringify(schedulesPayload));

      // React Native: los archivos van como { uri, name, type }, no como Blob
      formData.append('logo', {
        uri: logo,
        name: 'logo.jpg',
        type: 'image/jpeg',
      } as any);

      formData.append('cedulaFront', {
        uri: idFront,
        name: 'cedula_front.jpg',
        type: 'image/jpeg',
      } as any);

      formData.append('cedulaBack', {
        uri: idBack,
        name: 'cedula_back.jpg',
        type: 'image/jpeg',
      } as any);

      await api('/restaurant-requests', {
        method: 'POST',
        body: formData,
      });

      // Enviada OK: se descarta el borrador y se vuelve al perfil
      // (replace, no back: la pantalla pudo haberse abierto desde el
      // splash tras un reinicio y ahí no hay pila a la que volver).
      await RestaurantDraftStore.clear();
      AppAlert.alert('Solicitud enviada', 'Tu solicitud fue enviada y está en revisión.');
      router.replace('/(home)/(tabs)/perfil');
    } catch (e: any) {
      console.log('Error registrando restaurante:', e);
      AppAlert.alert('Error', e.message || 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCountries = COUNTRY_CODES.filter((c) =>
    (c.name + ' ' + c.dialCode).toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      bounces={false}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      {/* Parte superior */}
      <ImageBackground
        source={require('../../assets/images/splash.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          activeOpacity={0.85}
          onPress={handleExit}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.clocheWrapper}>
            <View style={styles.handle} />
            <View style={styles.lid} />
            <View style={styles.base} />
          </View>

          <Text style={styles.menuTitle}>MENÚ</Text>
          <Text style={styles.menuTitle}>DAYS</Text>
        </View>
      </ImageBackground>

      {/* Card blanca */}
      <View style={styles.card}>
        <Text style={styles.title}>Completa tu perfil</Text>

        {/* Logo */}
        <View style={styles.logoWrapper}>
          <TouchableOpacity style={styles.logoCircle} onPress={pickLogo}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} />
            ) : (
              <Ionicons name="camera-outline" size={26} color={colors.placeholder} />
            )}
          </TouchableOpacity>
          <Text style={styles.logoLabel}>Subir logo</Text>
        </View>

        {/* Nombre del restaurante */}
        <Text style={styles.label}>Nombre del restaurante</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="storefront-outline" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ingresa el nombre del restaurante"
            placeholderTextColor={colors.placeholder}
            value={restaurantName}
            onChangeText={setRestaurantName}
          />
        </View>

        {/* Provincia */}
        <Text style={styles.label}>Provincia</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setProvincePickerVisible(true)}
        >
          <Ionicons name="location-outline" size={20} color={colors.primary} style={styles.inputIcon} />
          <Text style={[styles.input, !province && styles.placeholderText]}>
            {province ? province.nombre : 'Elige la provincia'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.text} />
        </TouchableOpacity>

        {/* Cantón */}
        <Text style={styles.label}>Cantón</Text>
        <TouchableOpacity
          style={[styles.inputContainer, !province && styles.inputDisabled]}
          onPress={openCityPicker}
          disabled={!province}
        >
          <Ionicons name="location-outline" size={20} color={colors.primary} style={styles.inputIcon} />
          <Text style={[styles.input, !city && styles.placeholderText]}>
            {city ? city.nombre : province ? 'Elige el cantón' : 'Elige primero la provincia'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.text} />
        </TouchableOpacity>

        {/* Ubicación en el mapa */}
        <Text style={styles.label}>Ubicacion del restaurante</Text>
        <TouchableOpacity style={styles.locationButton} onPress={pickLocationOnMap}>
          <Ionicons name="pin" size={18} color={colors.primaryDark} style={styles.inputIcon} />
          <Text style={styles.locationButtonText} numberOfLines={1}>
            {location ? location.address : 'Seleccionar ubicación en el mapa'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.primaryDark} />
        </TouchableOpacity>

        {/* Teléfono */}
        <Text style={styles.label}>Teléfono</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity
            style={styles.countryCode}
            onPress={() => setCountryPickerVisible(true)}
          >
            <Text style={styles.flag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryCodeText}>{selectedCountry.dialCode}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.inputContainer, styles.phoneInputContainer]}>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el número de teléfono"
              placeholderTextColor={colors.placeholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Descripción */}
        <Text style={styles.label}>Descripción</Text>
        <View style={styles.textareaContainer}>
          <TextInput
            style={styles.textarea}
            placeholder="Cuéntanos sobre tu restaurante, especialidades, ambiente..."
            placeholderTextColor={colors.placeholder}
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, DESCRIPTION_MAX))}
            multiline
            maxLength={DESCRIPTION_MAX}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {description.length}/{DESCRIPTION_MAX}
          </Text>
        </View>

        {/* Redes sociales */}
        <Text style={styles.label}>Redes Sociales</Text>
        <Text style={styles.optionalLabel}>Opcional</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="logo-instagram" size={20} color="#E1306C" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="@tu_restaurante"
            placeholderTextColor={colors.placeholder}
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tu Restaurante EC"
            placeholderTextColor={colors.placeholder}
            value={facebook}
            onChangeText={setFacebook}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="logo-tiktok" size={20} color="#000000" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="@tu_restaurante"
            placeholderTextColor={colors.placeholder}
            value={tiktok}
            onChangeText={setTiktok}
            autoCapitalize="none"
          />
        </View>

        {/* Horarios -- mismo ScheduleEditor de "elegir días + completar
            una vez" que usa editar-perfil, para que la experiencia sea
            idéntica en el registro y después al editar el perfil. */}
        <Text style={styles.label}>Horarios de atención</Text>
        <ScheduleEditor
          schedule={scheduleForEditor}
          onChange={handleScheduleChange}
          hideClosed
        />

        {/* Documentos */}
        <Text style={styles.label}>Documentos</Text>
        <Text style={styles.optionalLabel}>Cédula de identidad del propietario</Text>

        <View style={styles.documentsRow}>
          <TouchableOpacity style={styles.documentBox} onPress={() => pickDocument('front')}>
            {idFront ? (
              <Image source={{ uri: idFront }} style={styles.documentImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={22} color={colors.placeholder} />
                <Text style={styles.documentLabel}>Frontal</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.documentBox} onPress={() => pickDocument('back')}>
            {idBack ? (
              <Image source={{ uri: idBack }} style={styles.documentImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={22} color={colors.placeholder} />
                <Text style={styles.documentLabel}>Posterior</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Botón enviar */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <LinearGradient
            colors={['#FFB74D', '#FB8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'Enviando...' : 'Enviar solicitud'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Selector de provincia */}
      <Modal
        visible={provincePickerVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setProvincePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* KeyboardAvoidingView acá adentro: el Modal es su propia
              jerarquía nativa y no hereda el manejo de teclado de la
              pantalla de atrás. */}
          <KeyboardAvoidingView
            style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}
            behavior="padding"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elige la provincia</Text>
              <TouchableOpacity onPress={() => setProvincePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={18} color={colors.placeholder} style={styles.inputIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar provincia"
                placeholderTextColor={colors.placeholder}
                value={provinceSearch}
                onChangeText={setProvinceSearch}
              />
            </View>

            <FlatList
              data={filteredProvinces}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => handleSelectProvince(item)}
                >
                  <Text style={styles.countryRowName}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.countryDivider} />}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Selector de ciudad */}
      <Modal
        visible={cityPickerVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setCityPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}
            behavior="padding"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Elige el cantón{province ? ` (${province.nombre})` : ''}
              </Text>
              <TouchableOpacity onPress={() => setCityPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={18} color={colors.placeholder} style={styles.inputIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar cantón"
                placeholderTextColor={colors.placeholder}
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text style={styles.countryRowName}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.countryDivider} />}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No hay cantones para esta provincia</Text>
              }
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Selector de código de país */}
      <Modal
        visible={countryPickerVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}
            behavior="padding"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elige el país</Text>
              <TouchableOpacity onPress={() => setCountryPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={18} color={colors.placeholder} style={styles.inputIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar país o código"
                placeholderTextColor={colors.placeholder}
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => {
                    setSelectedCountry(item);
                    setCountryPickerVisible(false);
                    setCountrySearch('');
                  }}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.countryRowName}>{item.name}</Text>
                  <Text style={styles.countryRowDial}>{item.dialCode}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.countryDivider} />}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 280,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  menuTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
    paddingHorizontal: 8,
    lineHeight: 48,
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  logoLabel: {
    fontSize: 13,
    color: colors.placeholder,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  optionalLabel: {
    fontSize: 12,
    color: colors.placeholder,
    marginBottom: 8,
    marginTop: -6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  placeholderText: {
    color: colors.placeholder,
  },
  inputDisabled: {
    backgroundColor: colors.inputBackground,
    opacity: 0.7,
  },
  emptyListText: {
    textAlign: 'center',
    color: colors.placeholder,
    fontSize: 14,
    paddingVertical: 24,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 12,
    gap: 6,
  },
  flag: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  textareaContainer: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 16,
  },
  textarea: {
    fontSize: 14,
    color: colors.text,
    height: 90,
  },
  charCount: {
    fontSize: 12,
    color: colors.placeholder,
    textAlign: 'right',
    marginTop: 4,
  },
  documentsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  documentBox: {
    flex: 1,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderStyle: 'dashed',
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  documentLabel: {
    fontSize: 12,
    color: colors.placeholder,
  },
  button: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  buttonGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  countryRowName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  countryRowDial: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  countryDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  clocheWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  handle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFA726',
    marginBottom: -2,
    zIndex: 3,
  },
  lid: {
    width: 100,
    height: 48,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    backgroundColor: '#FFA726',
    zIndex: 2,
  },
  base: {
    width: 115,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFA726',
    marginTop: 2,
  },
});