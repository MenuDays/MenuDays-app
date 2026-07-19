import { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;
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
  const scrollRef = useRef<ScrollView>(null);
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

  return (
    <View style={styles.container}>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>

            {/* La imagen va PRIMERO (queda atrás). El texto se renderiza
                después, así queda siempre por encima y nunca desaparece. */}
            <Image
              source={slide.image}
              style={styles.foodImage}
              resizeMode="cover"
            />

            <Text style={styles.title}>
              {slide.title}
            </Text>

            <Text style={styles.subtitle}>
              {slide.subtitle}
            </Text>

          </View>
        ))}
      </ScrollView>


      {/* Dots + botón, fijos abajo, encima del carrusel */}
      <View style={styles.footer}>

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
    height: SCREEN_HEIGHT,
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

});