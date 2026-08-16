import { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppAlert } from '../components/common/AppAlert';

const { width } = Dimensions.get('window');
const SCREEN_WIDTH = Math.round(width);
const SCREEN_HEIGHT = Math.round(Dimensions.get('screen').height);

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  image: any;
  buttonLabel: string;
};

const SLIDES: Slide[] = [
  {
    key: 'slide1',
    title: 'Descubre\nsabores increíbles',
    subtitle: 'Explora los mejores restaurantes\nde todo Ecuador.',
    image: require('../../assets/images/onboarding-1.png'),
    buttonLabel: 'Siguiente',
  },
  {
    key: 'slide2',
    title: 'Menú del día,\ntodos los días',
    subtitle: 'Encuentra opciones deliciosas\ny a precios increíbles cerca de vos',
    image: require('../../assets/images/onboarding-2.png'),
    buttonLabel: 'Siguiente',
  },
  {
    key: 'slide3',
    title: 'Elije, explora\ny disfruta',
    subtitle: 'Explorá los mejores restaurantes\nde todo Ecuador.',
    image: require('../../assets/images/onboarding-3.png'),
    buttonLabel: 'Comenzar',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const fullHeight = SCREEN_HEIGHT + insets.bottom;

  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const goToIndex = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  const handleButtonPress = () => {
    if (isLastSlide) {
      router.replace('/(auth)/login');
    } else {
      goToIndex(activeIndex + 1);
    }
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(newIndex);
  };

  function showPolicy(title: string, message: string) {
    AppAlert.alert(title, message, [{ text: "Entendido" }]);
  }

  return (
    <View style={styles.container}>

      {/* Capa de imágenes superpuestas, fuera del scroll, con cross-fade */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {SLIDES.map((slide, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          // Zoom sutil: la imagen entra un pelín más grande y se asienta
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [1.08, 1, 1.08],
            extrapolate: 'clamp',
          });

          return (
            <Animated.Image
              key={slide.key}
              source={slide.image}
              style={[
                styles.foodImage,
                {
                  height: fullHeight,
                  opacity,
                  transform: [{ scale }],
                },
              ]}
              resizeMode="cover"
            />
          );
        })}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const textOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          const textTranslateY = scrollX.interpolate({
            inputRange,
            outputRange: [16, 0, 16],
            extrapolate: 'clamp',
          });

          return (
            <View key={slide.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>

              <Animated.Text
                style={[
                  styles.title,
                  { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
                ]}
              >
                {slide.title}
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.subtitle,
                  { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
                ]}
              >
                {slide.subtitle}
              </Animated.Text>

            </View>
          );
        })}
      </Animated.ScrollView>


      {/* Dots + botón, fijos abajo, encima del carrusel */}
      <View style={[styles.footer, { bottom: Math.max(32, insets.bottom + 24) }]}>

        <View style={styles.dotsRow}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={handleButtonPress}
        >
          <Text style={styles.buttonText}>
            {SLIDES[activeIndex].buttonLabel}
          </Text>
          <Text style={styles.buttonArrow}>
            →
          </Text>
        </TouchableOpacity>

        <Text style={styles.policyText}>
          Al continuar, aceptás nuestros{' '}
          <Text
            style={styles.policyLink}
            onPress={() =>
              showPolicy(
                'Términos y Condiciones',
                'Al usar MenuDays aceptás nuestras condiciones de uso: la app conecta comensales con restaurantes de Ecuador, y cada restaurante es responsable de la información de sus menús, precios y pedidos.'
              )
            }
          >
            Términos de Uso
          </Text>
          {' '}y nuestra{' '}
          <Text
            style={styles.policyLink}
            onPress={() =>
              showPolicy(
                'Política de Privacidad',
                'Usamos tu ubicación y datos de perfil únicamente para mostrarte restaurantes y menús cercanos, y para gestionar tus pedidos. No compartimos tu información con terceros sin tu consentimiento.'
              )
            }
          >
            Política de Privacidad
          </Text>
          .
        </Text>

      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F7941D',
  },

  slide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 90,
    paddingHorizontal: 32,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#141428',
    textAlign: 'center',
    lineHeight: 36,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#141428',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 21,
  },

  foodImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    top: 0,
    left: 0,
  },

  footer: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    alignItems: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(20,20,40,0.25)',
    marginHorizontal: 4,
  },

  dotActive: {
    width: 22,
    backgroundColor: '#141428',
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: SCREEN_WIDTH - 64,
  },

  buttonText: {
    color: '#F7941D',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 10,
  },

  buttonArrow: {
    color: '#F7941D',
    fontSize: 16,
    fontWeight: '800',
  },

  policyText: {
    marginTop: 16,
    paddingHorizontal: 36,
    fontSize: 11.5,
    lineHeight: 16,
    color: 'rgba(20,20,40,0.65)',
    textAlign: 'center',
  },

  policyLink: {
    fontWeight: '700',
    color: '#141428',
    textDecorationLine: 'underline',
  },

});