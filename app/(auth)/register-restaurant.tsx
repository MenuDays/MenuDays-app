import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ImageBackground,
  Image,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import ProvinceService, { Province } from '../../services/province.service';
import LocationService, { City } from '../../services/location.service';
import RestaurantLocationPickerBridge from '../../services/restaurantLocationPicker.bridge';
import { api } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

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

export default function RegisterRestaurantScreen() {
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

  const DESCRIPTION_MAX = 200;

  useEffect(() => {
    ProvinceService.getAll().then(setProvinces);
  }, []);

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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para el logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      aspect: [1, 1],
      allowsEditing: true,
    });
    if (!result.canceled) setLogo(result.assets[0].uri);
  }

  async function pickDocument(side: 'front' | 'back') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara para la cédula.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      if (side === 'front') setIdFront(result.assets[0].uri);
      else setIdBack(result.assets[0].uri);
    }
  }

  function pickLocationOnMap() {
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

  async function handleSubmit() {
    if (!restaurantName.trim() || !province || !city || !phone.trim()) {
      Alert.alert('Campos incompletos', 'Completa nombre, provincia, ciudad y teléfono.');
      return;
    }

    if (!location) {
      Alert.alert('Ubicación requerida', 'Seleccioná la ubicación del restaurante en el mapa.');
      return;
    }

    if (!logo) {
      Alert.alert('Logo requerido', 'Subí el logo de tu restaurante.');
      return;
    }

    if (!idFront || !idBack) {
      Alert.alert('Documentos requeridos', 'Subí el frente y el dorso de tu cédula.');
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
      if (instagram.trim()) socialNetworks.instagram = instagram.trim();
      if (facebook.trim()) socialNetworks.facebook = facebook.trim();
      if (tiktok.trim()) socialNetworks.tiktok = tiktok.trim();
      if (Object.keys(socialNetworks).length > 0) {
        formData.append('socialNetworks', JSON.stringify(socialNetworks));
      }

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

      Alert.alert('Solicitud enviada', 'Tu solicitud fue enviada y está en revisión.');
      router.back();
    } catch (e: any) {
      console.log('Error registrando restaurante:', e);
      Alert.alert('Error', e.message || 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCountries = COUNTRY_CODES.filter((c) =>
    (c.name + ' ' + c.dialCode).toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Parte superior */}
      <ImageBackground
        source={require('../../assets/images/splash.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
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
              <Ionicons name="camera-outline" size={26} color="#BDBDBD" />
            )}
          </TouchableOpacity>
          <Text style={styles.logoLabel}>Subir logo</Text>
        </View>

        {/* Nombre del restaurante */}
        <Text style={styles.label}>Nombre del restaurante</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="storefront-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ingresá  el nombre del restaurante"
            placeholderTextColor="#9E9E9E"
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
          <Ionicons name="location-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <Text style={[styles.input, !province && styles.placeholderText]}>
            {province ? province.nombre : 'Elige la provincia'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#3E2723" />
        </TouchableOpacity>

        {/* Ciudad */}
        <Text style={styles.label}>Ciudad</Text>
        <TouchableOpacity
          style={[styles.inputContainer, !province && styles.inputDisabled]}
          onPress={openCityPicker}
          disabled={!province}
        >
          <Ionicons name="location-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <Text style={[styles.input, !city && styles.placeholderText]}>
            {city ? city.nombre : province ? 'Elige la  ciudad' : 'Elegí primero la provincia'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#3E2723" />
        </TouchableOpacity>

        {/* Ubicación en el mapa */}
        <Text style={styles.label}>Ubicacion del restaurante</Text>
        <TouchableOpacity style={styles.locationButton} onPress={pickLocationOnMap}>
          <Ionicons name="pin" size={18} color="#FB8C00" style={styles.inputIcon} />
          <Text style={styles.locationButtonText} numberOfLines={1}>
            {location ? location.address : 'Seleccionar ubicación en el mapa'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#FB8C00" />
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
            <Ionicons name="chevron-down" size={14} color="#3E2723" />
          </TouchableOpacity>
          <View style={[styles.inputContainer, styles.phoneInputContainer]}>
            <TextInput
              style={styles.input}
              placeholder="Ingresá  el número de teléfono"
              placeholderTextColor="#9E9E9E"
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
            placeholder="Contanos sobre tu restaurante, especialidades, ambiente..."
            placeholderTextColor="#9E9E9E"
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
            placeholderTextColor="#9E9E9E"
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
            placeholderTextColor="#9E9E9E"
            value={facebook}
            onChangeText={setFacebook}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="logo-tiktok" size={20} color="#000000" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="@tu_restaurante"
            placeholderTextColor="#9E9E9E"
            value={tiktok}
            onChangeText={setTiktok}
            autoCapitalize="none"
          />
        </View>

        {/* Documentos */}
        <Text style={styles.label}>Documentos</Text>
        <Text style={styles.optionalLabel}>Cédula de identidad del propietario</Text>

        <View style={styles.documentsRow}>
          <TouchableOpacity style={styles.documentBox} onPress={() => pickDocument('front')}>
            {idFront ? (
              <Image source={{ uri: idFront }} style={styles.documentImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={22} color="#9E9E9E" />
                <Text style={styles.documentLabel}>Frontal</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.documentBox} onPress={() => pickDocument('back')}>
            {idBack ? (
              <Image source={{ uri: idBack }} style={styles.documentImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={22} color="#9E9E9E" />
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
              <Ionicons name="search-outline" size={18} color="#9E9E9E" style={styles.inputIcon} />
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
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => handleSelectProvince(item)}
                >
                  <Text style={styles.countryRowName}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.countryDivider} />}
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
                Elegí la ciudad{province ? ` (${province.nombre})` : ''}
              </Text>
              <TouchableOpacity onPress={() => setCityPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#3E2723" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={18} color="#9E9E9E" style={styles.inputIcon} />
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
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text style={styles.countryRowName}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.countryDivider} />}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No hay ciudades para esta provincia</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Selector de código de país */}
      <Modal
        visible={countryPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elegí el país</Text>
              <TouchableOpacity onPress={() => setCountryPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#3E2723" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={18} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar país o código"
                placeholderTextColor="#9E9E9E"
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
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    lineHeight: 48,
  },
  card: {
    backgroundColor: '#FFFFFF',
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
    color: '#3E2723',
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
    backgroundColor: '#F5F5F5',
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
    color: '#9E9E9E',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3E2723',
    marginBottom: 8,
  },
  optionalLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 8,
    marginTop: -6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: '#3E2723',
  },
  placeholderText: {
    color: '#9E9E9E',
  },
  inputDisabled: {
    backgroundColor: '#FAFAFA',
    opacity: 0.7,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: 14,
    paddingVertical: 24,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFA726',
    backgroundColor: '#FFF8EE',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FB8C00',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: '#3E2723',
    fontWeight: '500',
  },
  phoneInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  textareaContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 16,
  },
  textarea: {
    fontSize: 14,
    color: '#3E2723',
    height: 90,
  },
  charCount: {
    fontSize: 12,
    color: '#9E9E9E',
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
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
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
    color: '#9E9E9E',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#3E2723',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3E2723',
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
    color: '#3E2723',
  },
  countryRowDial: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  countryDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
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