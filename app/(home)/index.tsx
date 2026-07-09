import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaveBottom from '../components/home/WaveBottom';
import WaveTop from '../components/home/WaveTop';
import Colors from '../../constants/Colors'; // ajustá el path si tu estructura es distinta

const C = Colors.light; // por ahora fijo en light, luego se puede swapear con useColorScheme

const CATEGORIES = [
  { id: 1, name: 'Ejecutivo', image:  require('../../assets/images/ejecutivo.png') },
  { id: 2, name: 'Mariscos', image: require('../../assets/images/mariscos.png') },
  { id: 3, name: 'Parillas', image: require('../../assets/images/parrillas.png') },
  { id: 4, name: 'Sopas', image: require('../../assets/images/sopas.png') },
  { id: 5, name: 'Pollo', image: require('../../assets/images/pollo.png') },
];

const RESTAURANTS = [
  { id: 1, name: 'El Banquito', logo: require('../../assets/images/logo-banquito.jpg') },
  { id: 2, name: 'Culinary', logo: require('../../assets/images/logo-culinary.jpg') },
  { id: 3, name: 'Sabor Ecuador', logo: require('../../assets/images/logo-sabor.png') },
  { id: 4, name: 'Resto', logo: require('../../assets/images/logo-resto.jpg') },
];

const MENUS = [
  {
    id: 1,
    restaurant: 'El Banquito',
    logo: require('../../assets/images/logo-banquito.jpg'),
    dish: 'Seco de pollo',
    description: '+ arroz + jugo',
    price: '$4.50',
    rating: 4.8,
    time: '20 min',
    distance: '1.8 km',
    image: require('../../assets/images/seco-pollo.png'),
    open: true,
  },
  {
    id: 2,
    restaurant: 'El Banquito',
    logo: require('../../assets/images/logo-banquito.jpg'),
    dish: 'Picada',
    description: '+ pollo + carne + yuca',
    price: '$4.50',
    rating: 4.8,
    time: '25 min',
    distance: '2.1 km',
    image: require('../../assets/images/picada.png'),
    open: true,
  },
  {
    id: 3,
    restaurant: 'Resto Taglines',
    logo: require('../../assets/images/logo-resto.jpg'),
    dish: 'Arroz marinero',
    description: '+ ensalada + limonada',
    price: '$4.75',
    rating: 4.9,
    time: '30 min',
    distance: '2.4 km',
    image: require('../../assets/images/arroz-marinero.png'),
    open: true,
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER NARANJA */}
        <LinearGradient colors={[C.primaryLight, C.primaryDark]} style={styles.header}>

          {/* Todo el contenido con padding horizontal va acá adentro,
              NO en el LinearGradient, para que WaveBottom (fuera de este
              wrapper) pueda usar el 100% del ancho real de pantalla */}
          <View style={styles.headerContent}>

            {/* Selector ubicación */}
            <TouchableOpacity style={styles.locationPill}>
              <Ionicons name="location-outline" size={18} color={C.text} />
              <Text style={styles.locationText}>Ubicación</Text>
              <Ionicons name="chevron-down" size={16} color={C.text} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Categorías */}
            <View style={styles.categoriesGrid}>
              <View style={styles.categoriesRow}>
                {CATEGORIES.slice(0, 3).map(cat => (
                  <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                    <View style={styles.categoryCircle}>
                      <Image source={cat.image} style={styles.categoryImage} />
                    </View>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.categoriesRow}>
                {CATEGORIES.slice(3, 5).map(cat => (
                  <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                    <View style={styles.categoryCircle}>
                      <Image source={cat.image} style={styles.categoryImage} />
                    </View>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>

          {/* Ondas al final del header — hijo directo del LinearGradient,
              sin padding horizontal de por medio → ancho completo */}
          <WaveBottom />

          {/* Botón Ver todos: absolute, flota sobre la onda sin ocupar
              espacio en el flujo */}
          <View style={styles.verTodosContainer}>
            <TouchableOpacity style={styles.verTodosButton}>
              <Text style={styles.verTodosText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

        </LinearGradient>

        {/* CONTENIDO BLANCO con onda superior */}
        <View style={styles.contentWrapper}>

          {/* Wave hijo directo de content, sin padding horizontal de por medio */}
          <WaveTop />
          <View style={styles.content}>
          {/* Todo el contenido con padding horizontal va en este wrapper */}
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

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={RESTAURANTS}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.restaurantsList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.restaurantCard}>
                  <Image source={item.logo} style={styles.restaurantLogo} />
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity style={styles.arrowButton}>
                  <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
                </TouchableOpacity>
              }
            />

            {/* Menús disponibles hoy */}
            <View style={styles.menusSectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Menús disponibles hoy</Text>
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {MENUS.map(menu => (
              <TouchableOpacity key={menu.id} style={styles.menuCard}>
                <View style={styles.menuImageContainer}>
                  <Image source={menu.image} style={styles.menuImage} />
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>{menu.price}</Text>
                  </View>
                </View>

                <View style={styles.menuInfo}>
                  <View style={styles.menuHeader}>
                    <Image source={menu.logo} style={styles.menuLogo} />
                    <Text style={styles.restaurantName}>{menu.restaurant}</Text>
                    <TouchableOpacity style={styles.favoriteButton}>
                      <Ionicons name="heart-outline" size={18} color={C.placeholder} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.dishName}>{menu.dish}</Text>
                  <Text style={styles.dishDescription}>{menu.description}</Text>

                  <View style={styles.menuMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={12} color={C.primary} />
                      <Text style={styles.metaText}>{menu.rating}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={12} color={C.textSecondary} />
                      <Text style={styles.metaText}>{menu.time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={12} color={C.textSecondary} />
                      <Text style={styles.metaText}>{menu.distance}</Text>
                    </View>
                    {menu.open && (
                      <View style={styles.openBadge}>
                        <Text style={styles.openText}>Abierto</Text>
                      </View>
                    )}
                  </View>
                </View>

              </TouchableOpacity>
            ))}

          </View>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.primaryDark },

  // Sin paddingHorizontal acá: así WaveBottom (hijo directo) toma el ancho completo
  // position: relative para que el botón "Ver todos" (absolute) se ancle acá adentro
  header: { paddingTop: 16, position: 'relative' },
  // El padding horizontal que tenía "header" se movió acá adentro
  headerContent: { paddingHorizontal: 16 },

  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'center',
    gap: 8,
  },
  locationText: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 12 },
  categoriesGrid: { gap: 12 },
  categoriesRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  categoryItem: { alignItems: 'center' },
  categoryCircle: {
  width: 90,
  height: 90,
  borderRadius: 45,
  backgroundColor: Colors.light.background,
  overflow: 'hidden',
  borderWidth: 2,
  borderColor: Colors.light.primaryDark, // el borde naranja tipo el SVG
},
  categoryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryPill: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: -8,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#FB8C00',
  },
  categoryName: { fontSize: 12, fontWeight: '600', color: Colors.light.text },
  verTodosContainer: {
    position: 'absolute',
    bottom: 6, // valor para que quede montado justo sobre la curva de la onda
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,   // más alto que WaveTop (10), para ganar siempre el orden de pintado
    elevation: 20, // elevation manda sobre el orden del árbol
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

  // Sin paddingHorizontal acá así WaveTop toma el ancho completo
  content: { backgroundColor: Colors.light.background, paddingBottom: 100 },
  // El padding horizontal que tenía "content" se movió acá adentro
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
  restaurantName: { fontSize: 13, color: Colors.light.textSecondary, flex: 1 },
  favoriteButton: { padding: 2 },
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