import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Dimensions,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAvoidingScreen from '../../components/common/KeyboardAvoidingScreen';
import { optimizedImageUri } from '../../../utils/imageUrl';
import WaveBottom from '../../components/home/WaveBottom';
import WaveTop from '../../components/home/WaveTop';
import UserService, { User } from '../../../services/user.service';
import AuthService from '../../../services/auth.service';
import CategoryService, { Category } from '../../../services/category.service';
import ExploreService, { ExploreRestaurant } from '../../../services/explore.service';
import PublicMenuService, { PublicMenu } from '../../../services/public-menu.service';
import PublicDishService, { PublicDish } from '../../../services/public-dish.service';
import { useDeviceLocation } from '../../../hooks/useDeviceLocation';
import { getCategoryIcon } from '../../../constants/categoryIcons';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ThemeColors } from '../../../contexts/ThemeContext';
import { usePreviewMode } from '../../../contexts/PreviewModeContext';
import { AppAlert, AlertButton } from '../../components/common/AppAlert';

// Categorías: vienen del back (GET /categories), con el ícono en
// item.iconos.url. El back las devuelve ordenadas alfabéticamente. Antes
// acá se mostraban solo 5 curadas -- ahora se muestran las 30 en un
// carrusel con efecto "lente" (la de en medio se agranda al scrollear).
const CATEGORY_ITEM_WIDTH = 58;
const CATEGORY_ITEM_GAP = 14;
const CATEGORY_STRIDE = CATEGORY_ITEM_WIDTH + CATEGORY_ITEM_GAP;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// El carrusel usa TODO el ancho del dispositivo (se sale del padding de
// headerContent con marginHorizontal negativo) y con un inset mínimo a
// los costados -> los íconos entran y salen de pantalla "escondiéndose"
// contra el borde, sin margen vacío al costado.
const HEADER_CONTENT_PADDING = 16;
const CAROUSEL_SIDE_PADDING = 8;

// Mismas opciones de radio que restaurantes.tsx/menus.tsx (0 = "cualquiera").
// Antes Inicio no tenía la opción "cualquiera" -- pero con pocos
// restaurantes cargados y lejos de la ubicación guardada, esto hacía que
// Inicio se viera vacío sin ninguna forma de ampliar la búsqueda desde
// acá (había que ir hasta la pestaña Menús para eso).
const DISTANCE_OPTIONS = [1, 2, 5, 10, 0];

// El header naranja usa el MISMO gradiente en Light y Dark (identidad de
// marca, no cambia con el tema -- ver Colors.ts, primaryLight/primaryDark
// son iguales en ambos). Por eso el texto/íconos que van directo sobre el
// naranja (no dentro de una card/pill que sí cambia con el tema) usan
// este color fijo en vez de `colors.text`, que sí sigue el tema y en
// Dark queda casi blanco -- ilegible sobre el pill blanco/naranja.
const HEADER_PILL_TEXT = '#3E2723';

// Mismo mapeo de estado operativo que menus.tsx, para la tira "Menús
// disponibles hoy" (acá viene de item.restaurante.estado_operativo).
const OPEN_LABEL: Record<string, { text: string; color: string }> = {
  abierto: { text: 'Abierto', color: '#43A047' },
  cerrado: { text: 'Cerrado', color: '#E53935' },
  cerrado_temporal: { text: 'Cerrado temporalmente', color: '#E53935' },
  vacaciones: { text: 'En vacaciones', color: '#FB8C00' },
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { previewOrigin, exitPreview } = usePreviewMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  // Maneja el efecto "lente" del carrusel de categorías: cada item lee
  // su escala interpolando contra esta posición de scroll compartida.
  const categoryScrollX = useRef(new Animated.Value(0)).current;

  // Drift horizontal sutil y continuo para los íconos de categorías, extra
  // por encima del efecto "lente" (scale) que ya reacciona al scroll --
  // este anda solo todo el tiempo, muy lento y de rango chico (±2.5px) para
  // que se sienta "vivo" sin marear ni competir con el gesto de scroll ni
  // con el touch del usuario (useNativeDriver, no toca el hilo de JS).
  const iconDriftAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconDriftAnim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconDriftAnim, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [iconDriftAnim]);
  const iconDriftX = iconDriftAnim.interpolate({ inputRange: [0, 1], outputRange: [-2.5, 2.5] });

  // Auto-scroll continuo del carrusel de categorías (derecha a izquierda,
  // solo, sin que nadie lo toque) -- por encima de TODO lo que ya tenía
  // (efecto lente + drift de íconos), no lo reemplaza: sigue siendo un
  // scroll real, así que el usuario puede seguir arrastrándolo a mano en
  // cualquier momento. Se pausa mientras hay un touch activo y retoma
  // solo, un rato después de soltar, desde donde haya quedado.
  const categoryListRef = useRef<Animated.FlatList<any>>(null);
  const categoryAutoOffset = useRef(0);
  const categoryContentWidth = useRef(0);
  const categoryAutoPaused = useRef(false);
  useEffect(() => {
    if (categories.length === 0) return;
    const interval = setInterval(() => {
      if (categoryAutoPaused.current) return;
      const maxOffset = categoryContentWidth.current - SCREEN_WIDTH;
      if (maxOffset <= 0) return;
      categoryAutoOffset.current += 0.5;
      if (categoryAutoOffset.current >= maxOffset) {
        categoryAutoOffset.current = 0;
      }
      categoryListRef.current?.scrollToOffset({
        offset: categoryAutoOffset.current,
        animated: false,
      });
    }, 30);
    return () => clearInterval(interval);
  }, [categories.length]);

  // "Restaurantes cercanos" -- GET /explore/restaurants, mismo endpoint
  // que restaurantes.tsx (ExploreService). Se guarda la respuesta
  // completa (sin cortar) para poder derivar de ahí tanto la tira de
  // "cercanos" como la de "destacados" (4+ estrellas) sin duplicar el
  // fetch.
  const [restaurants, setRestaurants] = useState<ExploreRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);

  const nearbyRestaurants = useMemo(() => restaurants.slice(0, 10), [restaurants]);

  // "Restaurantes destacados" -- mismos restaurantes de la tira de
  // arriba (mismo radio/ubicación), filtrados a calificación >= 4 y
  // ordenados de mejor a peor. Si ningún restaurante llega a 4
  // estrellas todavía (calificación arranca en 0 hasta la primera
  // reseña), la sección simplemente no se muestra.
  const featuredRestaurants = useMemo(
    () =>
      [...restaurants]
        .filter((r) => r.calificacion_promedio >= 4)
        .sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
        .slice(0, 10),
    [restaurants]
  );

  // "Menús disponibles hoy" -- GET /public/menus, mismo endpoint que
  // menus.tsx (PublicMenuService).
  const [menus, setMenus] = useState<PublicMenu[]>([]);
  const [menusLoading, setMenusLoading] = useState(true);

  // "Platos destacados" y "Ofertas" -- GET /public/dishes con
  // destacado=true / enOferta=true (PublicDishService), mismo radio que
  // el resto de las tiras de la home.
  const [featuredDishes, setFeaturedDishes] = useState<PublicDish[]>([]);
  const [featuredDishesLoading, setFeaturedDishesLoading] = useState(true);
  const [offerDishes, setOfferDishes] = useState<PublicDish[]>([]);
  const [offerDishesLoading, setOfferDishesLoading] = useState(true);

  // Pull-to-refresh del ScrollView principal: re-dispara los 4 loaders
  // (usuario, categorías, restaurantes, menús) que ya arma esta pantalla,
  // cada uno maneja su propio try/catch/finally, así que Promise.all acá
  // nunca rechaza -- solo hace falta apagar el spinner al terminar.
  const [refreshing, setRefreshing] = useState(false);

  // Radio del pill "N km" -- afecta a ambas tiras (restaurantes y menús).
  const [radiusKm, setRadiusKm] = useState(5);

  // Ubicación reverse-geocodeada a partir de la lat/lng GUARDADA
  // en el perfil (la que se fijó en el mapa), NO del GPS en vivo.
  const { street, cityProvince, loading: locationLoading } = useDeviceLocation(
    user?.latitude,
    user?.longitude
  );
  const gpsAddress = [street, cityProvince].filter(Boolean).join(', ') || null;

  useEffect(() => {
    loadCategories();
  }, []);

  // loadUser() en useFocusEffect (NO en un useEffect de solo-montaje):
  // esta pantalla es un tab, así que React Navigation la mantiene montada
  // en memoria una vez visitada (no hay unmountOnBlur en el Tabs de
  // (home)/(tabs)/_layout.tsx) -- con un useEffect([]) de una sola vez,
  // loadUser() corría UNA VEZ en toda la sesión, así que si el usuario
  // cambiaba de ubicación después (Perfil o el pill de ubicación ->
  // /(province) -> vuelve acá con router.replace) el back ya tenía la
  // ubicación nueva guardada, pero esta pantalla seguía usando el
  // user.latitude/longitude viejo del primer mount para siempre -- por
  // eso los restaurantes/menús "cercanos" nunca reflejaban la ubicación
  // actualizada por más veces que se cambiara. Ahora se re-pide cada vez
  // que la pantalla vuelve a tener foco.
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  // Las tiras de restaurantes/menús dependen de la ubicación guardada del
  // usuario para poder filtrar por radio (igual que restaurantes.tsx y
  // menus.tsx); se disparan de nuevo apenas loadUser() resuelve. Sin
  // coords guardadas, se listan igual pero sin filtro de distancia.
  useEffect(() => {
    loadRestaurants();
    loadMenus();
    loadFeaturedDishes();
    loadOfferDishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.latitude, user?.longitude, user?.province?.id, radiusKm]);

  async function loadUser() {
    try {
      const data = await UserService.getMe();
      console.log('[HomeScreen] usuario recibido:', JSON.stringify(data, null, 2));
      setUser(data);
    } catch (e) {
      console.log('[HomeScreen] ERROR cargando usuario:', e);
    }
  }

  async function loadCategories() {
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (e) {
      console.log('[HomeScreen] ERROR cargando categorías:', e);
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function loadRestaurants() {
    setRestaurantsLoading(true);
    try {
      const useDistance = radiusKm !== 0 && user?.latitude != null && user?.longitude != null;
      const data = await ExploreService.findRestaurants({
        radius: useDistance ? radiusKm : undefined,
        latitude: useDistance ? user!.latitude : undefined,
        longitude: useDistance ? user!.longitude : undefined,
        // "Cualquier distancia" ya no trae TODO el país -- sin esto, un
        // comensal en Quito veía restaurantes de Guayaquil o Cuenca
        // mezclados en "cerca tuyo". Se acota a la provincia guardada.
        provinceId: !useDistance ? user?.province?.id : undefined,
      });
      setRestaurants(data);
    } catch (e) {
      console.log('[HomeScreen] ERROR cargando restaurantes cercanos:', e);
    } finally {
      setRestaurantsLoading(false);
    }
  }

  async function loadMenus() {
    setMenusLoading(true);
    try {
      const useDistance = radiusKm !== 0 && user?.latitude != null && user?.longitude != null;
      const data = await PublicMenuService.findAvailable({
        radius: useDistance ? radiusKm : undefined,
        latitude: useDistance ? user!.latitude : undefined,
        longitude: useDistance ? user!.longitude : undefined,
        provinceId: !useDistance ? user?.province?.id : undefined,
      });
      setMenus(data.slice(0, 6));
    } catch (e) {
      console.log('[HomeScreen] ERROR cargando menús disponibles hoy:', e);
    } finally {
      setMenusLoading(false);
    }
  }

  async function loadFeaturedDishes() {
    setFeaturedDishesLoading(true);
    try {
      const useDistance = radiusKm !== 0 && user?.latitude != null && user?.longitude != null;
      const data = await PublicDishService.findAvailable({
        radius: useDistance ? radiusKm : undefined,
        latitude: useDistance ? user!.latitude : undefined,
        longitude: useDistance ? user!.longitude : undefined,
        provinceId: !useDistance ? user?.province?.id : undefined,
        destacado: true,
      });
      setFeaturedDishes(data.slice(0, 10));
    } catch (e) {
      console.log('[HomeScreen] ERROR cargando platos destacados:', e);
    } finally {
      setFeaturedDishesLoading(false);
    }
  }

  async function loadOfferDishes() {
    setOfferDishesLoading(true);
    try {
      const useDistance = radiusKm !== 0 && user?.latitude != null && user?.longitude != null;
      const data = await PublicDishService.findAvailable({
        radius: useDistance ? radiusKm : undefined,
        latitude: useDistance ? user!.latitude : undefined,
        longitude: useDistance ? user!.longitude : undefined,
        provinceId: !useDistance ? user?.province?.id : undefined,
        enOferta: true,
      });
      setOfferDishes(data.slice(0, 10));
    } catch (e) {
      console.log('[HomeScreen] ERROR cargando platos en oferta:', e);
    } finally {
      setOfferDishesLoading(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    Promise.all([
      loadUser(),
      loadCategories(),
      loadRestaurants(),
      loadMenus(),
      loadFeaturedDishes(),
      loadOfferDishes(),
    ]).finally(() => setRefreshing(false));
  }

  // Selector de radio del pill "N km" -- reutiliza AppAlert (mismo patrón
  // que promptLocationChoice en MapLocationPicker) en vez de armar un
  // dropdown nuevo. Elegir una opción dispara el efecto de arriba, que
  // vuelve a pedir restaurantes/menús con el radio nuevo.
  // Botón para volver de "Ver como comensal" (admin/restaurante). Antes
  // era un pill flotante que se podía arrastrar por toda la pantalla --
  // se sentía "perdido"/en cualquier lado. Ahora vive fijo acá, al lado
  // del filtro de radio, que es lo primero que se ve al entrar en modo
  // preview (siempre aterriza en esta tab).
  async function handleExitPreview() {
    // El rol REAL del usuario logueado manda: `previewOrigin` es solo un
    // estado en memoria y si se pierde (remount, etc.) el fallback
    // ciego mandaba SIEMPRE a restaurante -- un admin terminaba en el
    // dashboard equivocado. Leemos el rol de la sesión guardada y solo
    // caemos a previewOrigin si esa lectura falla.
    let rol = previewOrigin as string | null;
    try {
      const session = await AuthService.getSession();
      if (session?.user?.rol) rol = session.user.rol;
    } catch {
      // sin sesión legible -> usamos previewOrigin
    }
    exitPreview();
    router.replace(
      rol === 'administrador' ? '/(admin)/dashboard' : '/(restaurant)/dashboard'
    );
  }

  function openDistancePicker() {
    AppAlert.alert(
      'Radio de búsqueda',
      'Elige hasta qué distancia buscar restaurantes y menús cerca de ti.',
      [
        ...DISTANCE_OPTIONS.map((km): AlertButton => ({
          text: km === 0 ? 'Cualquier distancia' : `${km} km`,
          onPress: () => setRadiusKm(km),
        })),
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }

  // Texto a mostrar en el pill: primero la dirección exacta reverse-geocodeada
  // a partir de la ubicación guardada en el perfil; si no hay coords guardadas
  // o falló el geocoding, cae a la ciudad guardada en el perfil; si tampoco
  // hay, muestra un placeholder.
  const locationLabel =
    gpsAddress ?? user?.city?.name ?? (locationLoading ? 'Buscando...' : 'Ubicación');

  const avatarInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';

  return (
    // edges sin "top" -> el header naranja llega hasta el borde de arriba
    // (detrás de la barra de estado), sin ese margen raro. El padding del
    // status bar lo pone el header mismo (insets.top).
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB8C00" />}
      >

        {/* HEADER NARANJA -- compacto: pill de ubicación + carrusel de
            categorías en una sola fila, con la onda como cierre visual. */}
        <LinearGradient
          colors={[colors.primaryLight, colors.primaryDark]}
          style={[styles.header, { paddingTop: insets.top + 4 }]}
        >

          <View style={styles.headerContent}>

            {/* Perfil (izquierda) + ubicación (derecha). */}
            <View style={styles.brandRow}>
              <TouchableOpacity
                style={styles.avatarButton}
                activeOpacity={0.85}
                onPress={() => router.push('/(home)/(tabs)/perfil')}
              >
                {user?.profilePhotoUrl ? (
                  <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{avatarInitials}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.locationPill}
                activeOpacity={0.85}
                onPress={() => router.push('/(province)')}
              >
                <Ionicons name="location-outline" size={14} color={HEADER_PILL_TEXT} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationLabel}
                </Text>
                <Ionicons name="chevron-down" size={12} color={HEADER_PILL_TEXT} />
              </TouchableOpacity>
            </View>

            {/* Categorías -- carrusel horizontal con efecto "lente" premium:
                cada ícono se agranda a medida que se acerca al centro de
                la pantalla y se achica hacia los costados, con momentum
                nativo (Animated.FlatList, useNativeDriver). */}
            {categoriesLoading ? (
              <View style={styles.categoriesLoadingWrap}>
                <ActivityIndicator size="small" color={HEADER_PILL_TEXT} />
              </View>
            ) : (
              <View style={styles.categoriesCarouselWrapper}>
                <Animated.FlatList
                  ref={categoryListRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={categories}
                  keyExtractor={(cat) => String((cat as Category).id)}
                  contentContainerStyle={styles.categoriesCarousel}
                  onContentSizeChange={(w) => {
                    categoryContentWidth.current = w;
                  }}
                  onScrollBeginDrag={() => {
                    categoryAutoPaused.current = true;
                  }}
                  onScrollEndDrag={() => {
                    // Retoma solo, un rato después de soltar -- no
                    // inmediatamente, para no pelearse con el momentum
                    // del gesto del usuario.
                    setTimeout(() => {
                      categoryAutoPaused.current = false;
                    }, 2000);
                  }}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: categoryScrollX } } }],
                    {
                      useNativeDriver: true,
                      listener: (e: any) => {
                        // Mantiene sincronizado el offset "de verdad" (ref
                        // plano) con lo que el usuario scrollea a mano,
                        // para que el auto-scroll retome desde ahí y no
                        // salte para atrás.
                        categoryAutoOffset.current = e.nativeEvent.contentOffset.x;
                      },
                    }
                  )}
                  scrollEventThrottle={16}
                  renderItem={({ item, index }) => {
                    const cat = item as Category;
                    // scrollX en el que el item `index` queda CENTRADO en
                    // pantalla (ahora el carrusel no usa el padding gigante
                    // de centrado, así que hay que compensarlo acá).
                    const centered =
                      index * CATEGORY_STRIDE +
                      CAROUSEL_SIDE_PADDING +
                      CATEGORY_ITEM_WIDTH / 2 -
                      SCREEN_WIDTH / 2;
                    const inputRange = [
                      centered - CATEGORY_STRIDE,
                      centered,
                      centered + CATEGORY_STRIDE,
                    ];
                    const scale = categoryScrollX.interpolate({
                      inputRange,
                      outputRange: [0.8, 1.18, 0.8],
                      extrapolate: 'clamp',
                    });
                    const opacity = categoryScrollX.interpolate({
                      inputRange,
                      outputRange: [0.65, 1, 0.65],
                      extrapolate: 'clamp',
                    });
                    return (
                      <TouchableOpacity
                        style={styles.categoryItem}
                        activeOpacity={0.85}
                        onPress={() => router.push({ pathname: '/(home)/explorar-resultados', params: { categoria: cat.nombre, categoriaId: String(cat.id) } })}
                      >
                        <Animated.View style={[styles.categoryCircle, { transform: [{ scale }, { translateX: iconDriftX }], opacity }]}>
                          {getCategoryIcon(cat.nombre) ? (
                            <Image
                              source={getCategoryIcon(cat.nombre)!}
                              style={styles.categoryImage}
                            />
                          ) : cat.iconos?.url ? (
                            <Image
                              source={{ uri: cat.iconos.url }}
                              style={styles.categoryImage}
                            />
                          ) : (
                            <View style={[styles.categoryImage, styles.categoryImagePlaceholder]}>
                              <Ionicons name="restaurant-outline" size={20} color={colors.placeholder} />
                            </View>
                          )}
                        </Animated.View>
                        <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">
                          {cat.nombre}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {/* "Ver todas" -- reubicado más arriba, pegado al carrusel de
                categorías, en vez de flotar sobre la onda como antes. */}
            <View style={styles.verTodosRow}>
              <TouchableOpacity
                style={styles.verTodosButton}
                activeOpacity={0.85}
                onPress={() => router.push('/(home)/(tabs)/explorar')}
              >
                <Text style={styles.verTodosText}>Ver todas</Text>
                <Ionicons name="arrow-forward" size={13} color={colors.primaryDark} />
              </TouchableOpacity>
            </View>

          </View>

          {/* "MenuDays" -- pegado justo debajo de "Ver todas" (con un
              margen chico), antes de la onda, para que el header no se
              alargue de más. */}
          <View style={styles.brandWordmarkWrap}>
            <Text style={styles.brandWordmark}>
              Menu<Text style={styles.brandWordmarkAccent}>Days</Text>
            </Text>
          </View>

          <WaveBottom />

        </LinearGradient>

        {/* CONTENIDO BLANCO con onda superior */}
        <View style={styles.contentWrapper}>

          <WaveTop />
          <View style={styles.content}>
          <View style={styles.contentInner}>

            {/* Buscador */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={colors.placeholder} />
              <TextInput
                style={styles.searchInput}
                placeholder="Busca una comida..."
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* Restaurantes cercanos */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Restaurantes cercanos</Text>
              <View style={styles.sectionHeaderRight}>
                {previewOrigin && (
                  <TouchableOpacity style={styles.exitPreviewPill} onPress={handleExitPreview}>
                    <Ionicons name="exit-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.exitPreviewText}>Salir</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.distancePill} onPress={openDistancePicker}>
                  <Ionicons name="location-outline" size={13} color={colors.primary} />
                  <Text style={styles.distanceText}>{radiusKm === 0 ? 'Cualquiera' : `${radiusKm} km`}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {restaurantsLoading ? (
              <View style={styles.restaurantsLoadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : nearbyRestaurants.length === 0 ? (
              <Text style={styles.emptyStripText}>
                No encontramos restaurantes cerca de ti por ahora.
              </Text>
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={nearbyRestaurants}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.restaurantsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.restaurantCard}
                    onPress={() => router.push({ pathname: '/(home)/restaurante-detalle', params: { id: item.id } })}
                  >
                    {item.logo_url ? (
                      <Image
                        source={{ uri: item.logo_url }}
                        style={styles.restaurantLogo}
                      />
                    ) : (
                      <Ionicons name="storefront-outline" size={26} color="#BDBDBD" />
                    )}
                  </TouchableOpacity>
                )}
                ListFooterComponent={
                  <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={() => router.push("/(home)/restaurantes")}
                  >
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                }
              />
            )}

            {/* Restaurantes destacados -- los mejor calificados (4 a 5
                estrellas) dentro del mismo radio elegido arriba. */}
            {!restaurantsLoading && featuredRestaurants.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Restaurantes destacados</Text>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={featuredRestaurants}
                  keyExtractor={item => `featured-${item.id}`}
                  contentContainerStyle={styles.restaurantsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.featuredCard}
                      onPress={() => router.push({ pathname: '/(home)/restaurante-detalle', params: { id: item.id } })}
                    >
                      {item.logo_url ? (
                        <Image source={{ uri: item.logo_url }} style={styles.featuredLogo} />
                      ) : (
                        <View style={[styles.featuredLogo, styles.featuredLogoPlaceholder]}>
                          <Ionicons name="storefront-outline" size={22} color="#BDBDBD" />
                        </View>
                      )}
                      <Text style={styles.featuredName} numberOfLines={1}>{item.nombre_comercial}</Text>
                      <View style={styles.featuredRatingRow}>
                        <Ionicons name="star" size={11} color={colors.primary} />
                        <Text style={styles.featuredRatingText}>{item.calificacion_promedio.toFixed(1)}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {/* Ofertas -- platos que el propio restaurante marcó "en
                oferta" (con o sin precio rebajado). Carrusel bien
                vistoso para que salten a la vista apenas se abre la home. */}
            {!offerDishesLoading && offerDishes.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Ofertas</Text>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={offerDishes}
                  keyExtractor={(item) => `offer-${item.id}`}
                  contentContainerStyle={styles.dishCarouselList}
                  renderItem={({ item }) => (
                    <DishCarouselCard item={item} variant="oferta" styles={styles} />
                  )}
                />
              </>
            )}

            {/* Platos destacados -- elegidos a mano por el restaurante,
                no por un algoritmo (a diferencia de "Restaurantes
                destacados", que sale de la calificación). */}
            {!featuredDishesLoading && featuredDishes.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Platos destacados</Text>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={featuredDishes}
                  keyExtractor={(item) => `featured-dish-${item.id}`}
                  contentContainerStyle={styles.dishCarouselList}
                  renderItem={({ item }) => (
                    <DishCarouselCard item={item} variant="destacado" styles={styles} />
                  )}
                />
              </>
            )}

            {/* Menús disponibles hoy */}
            <View style={styles.menusSectionHeader}>
              <Text style={styles.sectionTitle}>Menús disponibles hoy</Text>
              <TouchableOpacity onPress={() => router.push('/(home)/(tabs)/menus')}>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {menusLoading ? (
              <View style={styles.restaurantsLoadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : menus.length === 0 ? (
              <Text style={styles.emptyStripText}>
                No hay menús del día publicados cerca de ti por ahora.
              </Text>
            ) : (
              menus.map(menu => {
                const status = OPEN_LABEL[menu.restaurante.estado_operativo] ?? OPEN_LABEL.cerrado;
                return (
                  <TouchableOpacity
                    key={menu.id}
                    style={styles.menuCard}
                    onPress={() => router.push({ pathname: '/(home)/pedido-producto', params: { id: menu.id, tipo: 'menu_dia' } })}
                  >
                    <View style={styles.menuImageContainer}>
                      {menu.foto_url ? (
                        <Image
                          source={{ uri: optimizedImageUri(menu.foto_url, 'card') }}
                          style={styles.menuImage}
                        />
                      ) : (
                        <View style={[styles.menuImage, styles.menuImagePlaceholder]}>
                          <Ionicons name="restaurant-outline" size={22} color="#BDBDBD" />
                        </View>
                      )}
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>${menu.precio.toFixed(2)}</Text>
                      </View>
                    </View>

                    <View style={styles.menuInfo}>
                      <View style={styles.menuHeader}>
                        {menu.restaurante.logo_url ? (
                          <Image
                            source={{ uri: menu.restaurante.logo_url }}
                            style={styles.menuLogo}
                          />
                        ) : (
                          <View style={[styles.menuLogo, styles.menuLogoPlaceholder]}>
                            <Ionicons name="storefront-outline" size={12} color="#BDBDBD" />
                          </View>
                        )}
                        <Text style={styles.restaurantName} numberOfLines={1}>{menu.restaurante.nombre_comercial}</Text>
                      </View>

                      <Text style={styles.dishName} numberOfLines={1}>{menu.nombre}</Text>
                      {menu.descripcion ? (
                        <Text style={styles.dishDescription} numberOfLines={1}>{menu.descripcion}</Text>
                      ) : null}

                      <View style={styles.menuMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="star" size={12} color={colors.primary} />
                          <Text style={styles.metaText}>{menu.restaurante.calificacion_promedio.toFixed(1)}</Text>
                        </View>
                        {menu.distancia != null && (
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{menu.distancia.toFixed(1)} km</Text>
                          </View>
                        )}
                        <View style={styles.openBadge}>
                          <Text style={[styles.openText, { color: status.color }]}>{status.text}</Text>
                        </View>
                      </View>
                    </View>

                  </TouchableOpacity>
                );
              })
            )}

          </View>
        </View>
      </View>
      </ScrollView>
      </KeyboardAvoidingScreen>
    </SafeAreaView>
  );
}

// Card de "Ofertas" / "Platos destacados" -- mismo shape (PublicDish),
// distinto badge/gradiente según variant. Separado en su propio
// componente (no inline en el renderItem) porque se usa en dos
// FlatLists distintas.
function DishCarouselCard({
  item,
  variant,
  styles,
}: {
  item: PublicDish;
  variant: 'oferta' | 'destacado';
  styles: ReturnType<typeof createStyles>;
}) {
  const hasDiscountPrice = variant === 'oferta' && item.precio_oferta != null;
  const badgeColors: [string, string] =
    variant === 'oferta' ? ['#FF7043', '#E64A19'] : ['#FFC94D', '#F5A800'];

  return (
    <TouchableOpacity
      style={styles.dishCard}
      activeOpacity={0.9}
      onPress={() =>
        router.push({ pathname: '/(home)/pedido-producto', params: { id: item.id, tipo: 'plato' } })
      }
    >
      <View style={styles.dishCardImageWrap}>
        {item.plato_imagenes[0]?.url ? (
          <Image source={{ uri: optimizedImageUri(item.plato_imagenes[0].url, 'card') }} style={styles.dishCardImage} />
        ) : (
          <View style={[styles.dishCardImage, styles.dishCardImagePlaceholder]}>
            <Ionicons name="fast-food-outline" size={24} color="#BDBDBD" />
          </View>
        )}
        <LinearGradient
          colors={badgeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.dishCardBadge}
        >
          <Ionicons name={variant === 'oferta' ? 'pricetag' : 'star'} size={10} color="#FFFFFF" />
          <Text style={styles.dishCardBadgeText}>{variant === 'oferta' ? 'Oferta' : 'Destacado'}</Text>
        </LinearGradient>
      </View>

      <View style={styles.dishCardInfo}>
        <Text style={styles.dishCardRestaurant} numberOfLines={1}>
          {item.restaurante.nombre_comercial}
        </Text>
        <Text style={styles.dishCardName} numberOfLines={2}>
          {item.nombre}
        </Text>
        <View style={styles.dishCardPriceRow}>
          {hasDiscountPrice ? (
            <>
              <Text style={styles.dishCardPriceOld}>${item.precio.toFixed(2)}</Text>
              <Text style={styles.dishCardPriceNew}>${item.precio_oferta!.toFixed(2)}</Text>
            </>
          ) : (
            <Text style={styles.dishCardPriceNew}>${item.precio.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  // transparent -> deja ver el fondo global (fondo_claro / fondo_oscuro).
  // El naranja de arriba lo pone el header (LinearGradient) igual.
  container: { flex: 1, backgroundColor: 'transparent' },
  // paddingTop dinámico (insets.top) se pasa inline. Acá solo el resto.
  header: { position: 'relative' },
  headerContent: { paddingHorizontal: 16 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Letra "WOW pero premium" para el wordmark: sans bien pesada + tracking
  // negativo (las letras un poco más juntas leen más como logo que como
  // texto suelto). "Menu" y "Days" van del mismo blanco sólido -- antes
  // "Days" tenía un blanco translúcido para diferenciarlo, pero se veía
  // gris/apagado en vez de premium.
  brandWordmark: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    // Sombra un poco más marcada: asegura contraste sin importar contra
    // qué parte del degradé (tomate -> naranja) termine cayendo el
    // texto, y le da un poco de profundidad al wordmark.
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandWordmarkAccent: {
    color: '#FFFFFF',
  },
  // Ahora vive justo debajo de "Ver todas" (antes del WaveBottom, que
  // pasó a ser el cierre visual del header) -- margen chico a propósito,
  // para que el header no se alargue de más.
  brandWordmarkWrap: {
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 0,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  avatarInitials: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '78%',
    gap: 5,
  },
  locationText: { fontSize: 12.5, fontWeight: '600', color: HEADER_PILL_TEXT, flexShrink: 1 },
  categoriesCarouselWrapper: {
    // Se sale del padding lateral de headerContent -> ancho completo real.
    marginHorizontal: -HEADER_CONTENT_PADDING,
    overflow: 'hidden',
  },
  categoriesCarousel: {
    paddingTop: 6,
    paddingBottom: 0,
    paddingHorizontal: CAROUSEL_SIDE_PADDING,
    gap: CATEGORY_ITEM_GAP,
  },
  categoryItem: { alignItems: 'center', width: CATEGORY_ITEM_WIDTH },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  categoryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  categoriesLoadingWrap: { paddingVertical: 20, alignItems: 'center' },
  categoryName: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '600',
    color: HEADER_PILL_TEXT,
    textAlign: 'center',
  },
  verTodosRow: {
    alignItems: 'center',
    marginTop: 5,
  },
  verTodosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  verTodosText: { color: colors.primaryDark, fontSize: 12.5, fontWeight: '700' },
  content: { backgroundColor: colors.background, paddingBottom: 100 },
  contentInner: { paddingHorizontal: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 24,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  // flexWrap + flexShrink en el título: antes, con el pill de "Salir de
  // vista previa" + el de distancia juntos, el conjunto podía ser más
  // ancho que lo que quedaba libre al lado del título y terminaba
  // pisándolo (fila sin wrap no encoge a sus hijos, solo desborda). Con
  // wrap, si no entran en la misma línea el grupo de pills baja a su
  // propia fila en vez de superponerse.
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flexShrink: 1 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  exitPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FB8C00',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exitPreviewText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    paddingVertical: 8,
    gap: 6,
  },
  distanceText: { fontSize: 13, color: colors.text },
  restaurantsList: { paddingBottom: 16, gap: 10 },
  restaurantsLoadingWrap: { paddingVertical: 20, alignItems: 'center' },
  emptyStripText: { fontSize: 12, color: colors.textSecondary, paddingBottom: 16 },
  restaurantCard: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantLogo: { width: 60, height: 60, resizeMode: 'contain' },
  arrowButton: { width: 40, height: 80, alignItems: 'center', justifyContent: 'center' },
  featuredCard: {
    width: 92,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    padding: 10,
    gap: 4,
  },
  featuredLogo: { width: 48, height: 48, borderRadius: 12, resizeMode: 'contain' },
  featuredLogoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  featuredName: { fontSize: 11.5, fontWeight: '700', color: colors.text, textAlign: 'center' },
  featuredRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featuredRatingText: { fontSize: 11, fontWeight: '700', color: colors.text },

  // ------- Carrusel de platos: "Ofertas" / "Platos destacados" -------
  dishCarouselList: { paddingRight: 16, gap: 12 },
  dishCard: {
    width: 152,
    borderRadius: 18,
    backgroundColor: colors.card,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dishCardImageWrap: { width: '100%', height: 100, position: 'relative' },
  dishCardImage: { width: '100%', height: '100%' },
  dishCardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  dishCardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  dishCardBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#FFFFFF' },
  dishCardInfo: { padding: 10, gap: 2 },
  dishCardRestaurant: { fontSize: 10.5, fontWeight: '600', color: colors.textSecondary },
  dishCardName: { fontSize: 13, fontWeight: '800', color: colors.text, lineHeight: 16, minHeight: 32 },
  dishCardPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  dishCardPriceOld: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  dishCardPriceNew: { fontSize: 14.5, fontWeight: '900', color: colors.primary },
  menusSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    // un toque más alto -> las 4 filas de texto no se cortan.
    height: 116,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuImageContainer: { width: 150, height: 116, position: 'relative' },
  menuImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  menuImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  priceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  menuInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  menuLogo: { width: 24, height: 24, borderRadius: 12, resizeMode: 'contain' },
  menuLogoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  restaurantName: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  dishName: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  dishDescription: { fontSize: 12, color: colors.placeholder },
  menuMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: 11, color: colors.textSecondary },
  openBadge: { backgroundColor: colors.surfaceSecondary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  openText: { fontSize: 11, color: colors.success, fontWeight: '600' },
  // Sube un poco el contenido para "comerse" parte de la onda naranja ->
  // el header queda más bajo y la onda arranca más arriba.
  contentWrapper: { marginTop: -40 },
});