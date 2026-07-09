import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Image,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Data de categorías
const CATEGORIES = [
  { id: 1, name: 'Ejecutivo', image: { uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200' } },
  { id: 2, name: 'Mariscos', image: { uri: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200' } },
  { id: 3, name: 'Parillas', image: { uri: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=200' } },
  { id: 4, name: 'Sopas', image: { uri: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200' } },
  { id: 5, name: 'Pollo', image: { uri: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=200' } },
];

const RESTAURANTS = [
  { id: 1, name: 'El Banquito', logo: { uri: 'https://via.placeholder.com/80' } },
  { id: 2, name: 'Culinary', logo: { uri: 'https://via.placeholder.com/80' } },
  { id: 3, name: 'Sabor Ecuador', logo: { uri: 'https://via.placeholder.com/80' } },
  { id: 4, name: 'Resto', logo: { uri: 'https://via.placeholder.com/80' } },
];

const MENUS = [
  {
    id: 1,
    restaurant: 'El Banquito',
    logo: { uri: 'https://via.placeholder.com/40' },
    dish: 'Seco de pollo',
    description: '+ arroz + jugo',
    price: '$4.50',
    rating: 4.8,
    time: '20 min',
    distance: '1.8 km',
    image: { uri: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300' },
    open: true,
  },
  {
    id: 2,
    restaurant: 'El Banquito',
    logo: { uri: 'https://via.placeholder.com/40' },
    dish: 'Picada',
    description: '+ pollo + carne + yuca',
    price: '$4.50',
    rating: 4.8,
    time: '25 min',
    distance: '2.1 km',
    image: { uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300' },
    open: true,
  },
  {
    id: 3,
    restaurant: 'Mar & Tierra',
    logo: { uri: 'https://via.placeholder.com/40' },
    dish: 'Arroz marinero',
    description: '+ ensalada + limonada',
    price: '$4.75',
    rating: 4.9,
    time: '30 min',
    distance: '2.4 km',
    image: { uri: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=300' },
    open: true,
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER NARANJA */}
        <LinearGradient colors={['#FFB74D', '#FB8C00']} style={styles.header}>

          {/* Selector ubicación */}
          <TouchableOpacity style={styles.locationPill}>
            <Ionicons name="home-outline" size={18} color="#3E2723" />
            <Text style={styles.locationText}>Ubicación</Text>
            <Ionicons name="chevron-down" size={16} color="#3E2723" />
          </TouchableOpacity>

          {/* Línea separadora */}
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

          {/* Ondas + Ver todos */}
          <View style={styles.waveContainer}>
            <TouchableOpacity style={styles.verTodosButton}>
              <Text style={styles.verTodosText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

        </LinearGradient>

        {/* CONTENIDO BLANCO */}
        <View style={styles.content}>

          {/* Buscador */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Busca una comida..."
              placeholderTextColor="#9E9E9E"
            />
          </View>

          {/* Restaurantes cercanos */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Restaurantes cercanos</Text>
            <TouchableOpacity style={styles.distancePill}>
              <Text style={styles.distanceText}>5 km</Text>
              <Ionicons name="chevron-down" size={14} color="#757575" />
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
                <Ionicons name="chevron-forward" size={20} color="#757575" />
              </TouchableOpacity>
            }
          />

          {/* Menús disponibles hoy */}
          <View style={styles.menusSectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Menús disponibles hoy</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </TouchableOpacity>
          </View>

          {MENUS.map(menu => (
            <TouchableOpacity key={menu.id} style={styles.menuCard}>
              {/* Imagen izquierda */}
              <View style={styles.menuImageContainer}>
                <Image source={menu.image} style={styles.menuImage} />
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>{menu.price}</Text>
                </View>
              </View>

              {/* Info derecha */}
              <View style={styles.menuInfo}>
                <View style={styles.menuHeader}>
                  <Image source={menu.logo} style={styles.menuLogo} />
                  <Text style={styles.restaurantName}>{menu.restaurant}</Text>
                  <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons name="heart-outline" size={18} color="#9E9E9E" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.dishName}>{menu.dish}</Text>
                <Text style={styles.dishDescription}>{menu.description}</Text>

                <View style={styles.menuMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={12} color="#FFA726" />
                    <Text style={styles.metaText}>{menu.rating}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color="#757575" />
                    <Text style={styles.metaText}>{menu.time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color="#757575" />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
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
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3E2723',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 12,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
  },
  categoryCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3E2723',
  },
  waveContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 20,
  },
  verTodosButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  verTodosText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3E2723',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#757575',
  },
  restaurantsList: {
    paddingBottom: 16,
    gap: 10,
  },
  restaurantCard: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantLogo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  arrowButton: {
    width: 40,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menusSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuImageContainer: {
    width: 130,
    height: 130,
    position: 'relative',
  },
  menuImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFA726',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  menuInfo: {
    flex: 1,
    padding: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  menuLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  restaurantName: {
    fontSize: 13,
    color: '#757575',
    flex: 1,
  },
  favoriteButton: {
    padding: 2,
  },
  dishName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 2,
  },
  dishDescription: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  menuMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    color: '#757575',
  },
  openBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  openText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
});