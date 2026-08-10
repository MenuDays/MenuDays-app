import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaveBottom from '../components/home/WaveBottom';
import WaveTop from '../components/home/WaveTop';
import Colors from '../../constants/Colors'; // ajustá el path si tu estructura es distinta
import UserService, { User } from '../../services/user.service';
import CategoryService, { Category } from '../../services/category.service';
import ExploreService, { ExploreRestaurant } from '../../services/explore.service';
import PublicMenuService, { PublicMenu } from '../../services/public-menu.service';
import { useDeviceLocation } from '../../hooks/useDeviceLocation';

const C = Colors.light; // por ahora fijo en light, luego se puede swapear con useColorScheme

// Categorías: vienen del back (GET /categories), con el ícono en
// item.iconos.url. Se muestran TODAS en un carrusel horizontal de una
// sola línea, con auto-scroll (ver homeCategories más abajo), así que
// da lo mismo si el back devuelve 5, 10 o más.
// Nombres curados que se usaban antes para filtrar solo 5 categorías
// en Inicio. Ya no se usa (ver homeCategories más abajo), pero queda
// como referencia por si se quiere volver a ese comportamiento.
const HOME_CATEGORY_NAMES = ['Ejecutivo', 'Mariscos', 'Parrillas', 'Sopas', 'Pollo'];

// Radio fijo de la tira de Inicio (el pill "5 km" de arriba, todavía no
// interactivo -- si se quiere hacerlo seleccionable, ver el patrón de
// DISTANCE_OPTIONS en restaurantes.tsx/menus.tsx).
const HOME_RADIUS_KM = 5;

// Mismo mapeo de estado operativo que menus.tsx, para la tira "Menús
// disponibles hoy" (acá viene de item.restaurante.estado_operativo).
const OPEN_LABEL: Record<string, { text: string; color: string }> = {
  abierto: { text: 'Abierto', color: '#43A047' },
  cerrado: { text: 'Cerrado', color: '#E53935' },
  cerrado_temporal: { text: 'Cerrado temporalmente', color: '#E53935' },
  vacaciones: { text: 'En vacaciones', color: '#FB8C00' },
};

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Carrusel de categorías: se mueve solo de a poquito, y si el usuario
  // lo toca para scrollear manualmente, se pausa el auto-scroll y
  // recién retoma unos segundos después de que lo suelta.
  const categoriesScrollRef = useRef<ScrollView>(null);
  const categoriesScrollX = useRef(0);
  const categoriesContentWidth = useRef(0);
  const categoriesViewportWidth = useRef(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeAutoScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startCategoriesAutoScroll() {
    stopCategoriesAutoScroll();
    autoScrollTimer.current = setInterval(() => {
      const maxScroll = categoriesContentWidth.current - categoriesViewportWidth.current;
      if (maxScroll <= 0) return; // no alcanza para scrollear (pocas categorías)

      let next = categoriesScrollX.current + 0.6; // velocidad del auto-scroll
      if (next >= maxScroll) next = 0; // vuelve al principio (loop)

      categoriesScrollX.current = next;
      categoriesScrollRef.current?.scrollTo({ x: next, animated: false });
    }, 16);
  }

  function stopCategoriesAutoScroll() {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }

  // Cuando el usuario empieza a arrastrar el carrusel manualmente, se
  // pausa el auto-scroll para no pelear con su gesto.
  function handleCategoriesTouchStart() {
    stopCategoriesAutoScroll();
    if (resumeAutoScrollTimeout.current) clearTimeout(resumeAutoScrollTimeout.current);
  }

  // Al soltar, se retoma el auto-scroll después de una pausa breve.
  function handleCategoriesTouchEnd() {
    if (resumeAutoScrollTimeout.current) clearTimeout(resumeAutoScrollTimeout.current);
    resumeAutoScrollTimeout.current = setTimeout(startCategoriesAutoScroll, 2500);
  }

  useEffect(() => {
    return () => {
      stopCategoriesAutoScroll();
      if (resumeAutoScrollTimeout.current) clearTimeout(resumeAutoScrollTimeout.current);
    };
  }, []);


  // "Restaurantes cercanos" -- GET /explore/restaurants, mismo endpoint
  // que restaurantes.tsx (ExploreService). Acá se muestran las primeras
  // filas nomás, a modo de vidriera; "Ver todas" ya lleva a esa pantalla
  // con el listado completo.
  const [restaurants, setRestaurants] = useState<ExploreRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);

  // "Menús disponibles hoy" -- GET /public/menus, mismo endpoint que
  // menus.tsx (PublicMenuService).
  const [menus, setMenus] = useState<PublicMenu[]>([]);
  const [menusLoading, setMenusLoading] = useState(true);

  // Ubicación reverse-geocodeada a partir de la lat/lng GUARDADA
  // en el perfil (la que se fijó en el mapa), NO del GPS en vivo.
  const { street, cityProvince, loading: locationLoading } = useDeviceLocation(
    user?.latitude,
    user?.longitude
  );
  const gpsAddress = [street, cityProvince].filter(Boolean).join(', ') || null;

  useEffect(() => {
    loadUser();
    loadCategories();
  }, []);

  // Las tiras de restaurantes/menús dependen de la ubicación guardada del
  // usuario para poder filtrar por radio (igual que restaurantes.tsx y
  // menus.tsx); se disparan de nuevo apenas loadUser() resuelve. Sin
  // coords guardadas, se listan igual pero sin filtro de distancia.
  useEffect(() => {
    loadRestaurants();
    loadMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.latitude, user?.longitude]);

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
      const useDistance = user?.latitude != null && user?.longitude != null;
      const data = await ExploreService.findRestaurants({
        radius: useDistance ? HOME_RADIUS_KM : undefined,
        latitude: useDistance ? user!.latitude : undefined,
        longitude: useDistance ? user!.longitude : undefined,
      });
      setRestaurants(data.slice(0, 10));
    } catch (e) {
      console.log('[HomeScreen] ERROR cargando restaurantes cercanos:', e);
    } finally {
      setRestaurantsLoading(false);
    }
  }

  async function loadMenus() {
    setMenusLoading(true);
    try {
      const useDistance = user?.latitude != null && user?.longitude != null;
      const data = await PublicMenuService.findAvailable({
        radius: useDistance ? HOME_RADIUS_KM : undefined,
        latitude: useDistance ? user!.latitude : undefined,
        longitude: useDistance ? user!.longitude : undefined,
      });
      setMenus(data.slice(0, 6));
    } catch (e) {
      console.log('[HomeScreen] ERROR cargando menús disponibles hoy:', e);
    } finally {
      setMenusLoading(false);
    }
  }

  // Categorías del carrusel de Inicio: se muestran TODAS las que
  // devuelve el back (antes eran solo 5 curadas por nombre). Al ser un
  // carrusel horizontal con auto-scroll, ahora da lo mismo si son 5,
  // 10 o más -- se acomodan solas. Si en algún momento se quiere volver
  // a curar cuáles se muestran acá, se puede filtrar por
  // HOME_CATEGORY_NAMES como antes.
  const homeCategories = categories;

  // Texto a mostrar en el pill: primero la dirección exacta reverse-geocodeada
  // a partir de la ubicación guardada en el perfil; si no hay coords guardadas
  // o falló el geocoding, cae a la ciudad guardada en el perfil; si tampoco
  // hay, muestra un placeholder.
  const locationLabel =
    gpsAddress ?? user?.city?.name ?? (locationLoading ? 'Buscando...' : 'Ubicación');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER NARANJA */}
        <LinearGradient colors={[C.primaryLight, C.primaryDark]} style={styles.header}>

          <View style={styles.headerContent}>

            {/* Selector ubicación */}
            <TouchableOpacity
              style={styles.locationPill}
              onPress={() => router.push('/(province)')}
            >
              <Ionicons name="location-outline" size={18} color={C.text} />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color={C.text} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Categorías */}
            {categoriesLoading ? (
              <View style={styles.categoriesLoadingWrap}>
                <ActivityIndicator size="small" color={C.text} />
              </View>
            ) : (
              <ScrollView
                ref={categoriesScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
                onLayout={(e) => {
                  categoriesViewportWidth.current = e.nativeEvent.layout.width;
                }}
                onContentSizeChange={(w) => {
                  categoriesContentWidth.current = w;
                  startCategoriesAutoScroll();
                }}
                onScrollBeginDrag={handleCategoriesTouchStart}
                onScrollEndDrag={handleCategoriesTouchEnd}
                onMomentumScrollEnd={handleCategoriesTouchEnd}
                onScroll={(e) => {
                  categoriesScrollX.current = e.nativeEvent.contentOffset.x;
                }}
                scrollEventThrottle={16}
              >
                {homeCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryItem}
                    onPress={() => router.push({ pathname: '/(home)/explorar-resultados', params: { categoria: cat.nombre } })}
                  >
                    <View style={styles.categoryCircle}>
                      {cat.iconos?.url ? (
                        <Image source={{ uri: cat.iconos.url }} style={styles.categoryImage} />
                      ) : (
                        <View style={[styles.categoryImage, styles.categoryImagePlaceholder]}>
                          <Ionicons name="restaurant-outline" size={22} color="#BDBDBD" />
                        </View>
                      )}
                    </View>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryName} numberOfLines={1}>{cat.nombre}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

          </View>

          <WaveBottom />

          <View style={styles.verTodosContainer}>
            <TouchableOpacity style={styles.verTodosButton} onPress={() => router.push('/(home)/explorar')}>
              <Text style={styles.verTodosText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

        </LinearGradient>

        {/* CONTENIDO BLANCO con onda superior */}
        <View style={styles.contentWrapper}>

          <WaveTop />
          <View style={styles.content}>
          <View style={styles.contentInner}>

            {/* Buscador */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={C.placeholder} />
              <TextInput
                style={styles.searchInput}
                placeholder="Busca una comida..."
                placeholderTextColor={C.placeholder}
              />
            </View>

            {/* Restaurantes cercanos */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Restaurantes cercanos</Text>
              <TouchableOpacity style={styles.distancePill}>
                <Text style={styles.distanceText}>5 km</Text>
                <Ionicons name="chevron-down" size={14} color={C.text} />
              </TouchableOpacity>
            </View>

            {restaurantsLoading ? (
              <View style={styles.restaurantsLoadingWrap}>
                <ActivityIndicator size="small" color={C.primary} />
              </View>
            ) : restaurants.length === 0 ? (
              <Text style={styles.emptyStripText}>
                No encontramos restaurantes cerca tuyo por ahora.
              </Text>
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={restaurants}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.restaurantsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.restaurantCard}
                    onPress={() => router.push({ pathname: '/(home)/restaurante-detalle', params: { id: item.id } })}
                  >
                    {item.logo_url ? (
                      <Image source={{ uri: item.logo_url }} style={styles.restaurantLogo} />
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
                    <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
                  </TouchableOpacity>
                }
              />
            )}

            {/* Menús disponibles hoy */}
            <View style={styles.menusSectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Menús disponibles hoy</Text>
              <TouchableOpacity onPress={() => router.push('/(home)/menus')}>
                <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {menusLoading ? (
              <View style={styles.restaurantsLoadingWrap}>
                <ActivityIndicator size="small" color={C.primary} />
              </View>
            ) : menus.length === 0 ? (
              <Text style={styles.emptyStripText}>
                No hay menús del día publicados cerca tuyo por ahora.
              </Text>
            ) : (
              menus.map(menu => {
                const status = OPEN_LABEL[menu.restaurante.estado_operativo] ?? OPEN_LABEL.cerrado;
                return (
                  <TouchableOpacity
                    key={menu.id}
                    style={styles.menuCard}
                    onPress={() => router.push({ pathname: '/(home)/restaurante-detalle', params: { id: menu.restaurante_id } })}
                  >
                    <View style={styles.menuImageContainer}>
                      {menu.foto_url ? (
                        <Image source={{ uri: menu.foto_url }} style={styles.menuImage} />
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
                          <Image source={{ uri: menu.restaurante.logo_url }} style={styles.menuLogo} />
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
                          <Ionicons name="star" size={12} color={C.primary} />
                          <Text style={styles.metaText}>{menu.restaurante.calificacion_promedio.toFixed(1)}</Text>
                        </View>
                        {menu.distancia != null && (
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={12} color={C.textSecondary} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingTop: 16, position: 'relative' },
  headerContent: { paddingHorizontal: 16 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'center',
    maxWidth: '80%',
    gap: 8,
  },
  locationText: { fontSize: 15, fontWeight: '600', color: Colors.light.text, flexShrink: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 12 },
  categoriesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 4 },
  categoryItem: { alignItems: 'center', width: 68 },
  categoryCircle: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: Colors.light.background,
  overflow: 'hidden',
  borderWidth: 2,
  borderColor: Colors.light.primaryDark,
},
  categoryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  categoriesLoadingWrap: { paddingVertical: 30, alignItems: 'center' },
  categoryPill: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: -6,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#FB8C00',
    maxWidth: 68,
  },
  categoryName: { fontSize: 11, fontWeight: '600', color: Colors.light.text, textAlign: 'center' },
  verTodosContainer: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  verTodosButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
},
verTodosText: { color: Colors.light.primaryDark, fontSize: 13, fontWeight: '700' },
  content: { backgroundColor: Colors.light.background, paddingBottom: 100 },
  contentInner: { paddingHorizontal: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 24,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.light.text },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.background,
    paddingVertical: 8,
    gap: 6,
  },
  distanceText: { fontSize: 13, color: Colors.light.text },
  restaurantsList: { paddingBottom: 16, gap: 10 },
  restaurantsLoadingWrap: { paddingVertical: 20, alignItems: 'center' },
  emptyStripText: { fontSize: 12, color: Colors.light.textSecondary, paddingBottom: 16 },
  restaurantCard: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantLogo: { width: 60, height: 60, resizeMode: 'contain' },
  arrowButton: { width: 40, height: 80, alignItems: 'center', justifyContent: 'center' },
  menusSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    height: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuImageContainer: { width: 150, height: 100, position: 'relative' },
  menuImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  menuImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  priceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: { color: Colors.light.background, fontSize: 13, fontWeight: 'bold' },
  menuInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  menuLogo: { width: 24, height: 24, borderRadius: 12, resizeMode: 'contain' },
  menuLogoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  restaurantName: { fontSize: 13, color: Colors.light.textSecondary, flex: 1 },
  dishName: { fontSize: 15, fontWeight: 'bold', color: Colors.light.text, marginBottom: 2 },
  dishDescription: { fontSize: 12, color: Colors.light.placeholder },
  menuMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: 11, color: Colors.light.textSecondary },
  openBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  openText: { fontSize: 11, color: Colors.light.success, fontWeight: '600' },
  contentWrapper: {
  marginTop: -20, },
});