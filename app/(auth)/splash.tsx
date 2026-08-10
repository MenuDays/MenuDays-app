import { View, Text, StyleSheet, Animated, Easing, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { router, type Href } from 'expo-router';
import { Image } from 'react-native';
import AuthService from '../../services/auth.service';


// Adónde mandar a cada rol una vez logueado. Mismo mapeo que usa
// login.tsx después de un login exitoso.
function routeForRole(rol: string | undefined): Href {
  if (rol === 'administrador') return '/(admin)/dashboard';
  if (rol === 'restaurante') return '/(restaurant)/dashboard';
  return '/(province)';
}

export default function SplashScreen() {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lidAnim = useRef(new Animated.Value(0)).current;
  const vaporOpacity = useRef(new Animated.Value(0)).current;
  const vaporY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1Y = useRef(new Animated.Value(30)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2Y = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Chequeo de sesión en paralelo con la animación (no la bloquea):
    // arranca ya y para cuando termine la secuencia de abajo ya
    // tenemos la respuesta lista.
    const sessionPromise = AuthService.getSession();

    Animated.sequence([
      // 1. Barra de carga
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      // 2. Tapa sube + texto desaparece
      Animated.parallel([
        Animated.timing(lidAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // 3. Vapor aparece
      Animated.parallel([
        Animated.timing(vaporOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(vaporY, {
          toValue: -8,
          duration: 700,
          useNativeDriver: true,
        }),]),
      // 4. Tarjetas aparecen
      Animated.parallel([
        Animated.timing(card1Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(card1Y, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(card2Opacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(card2Y, {
          toValue: 0,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(async () => {
        const session = await sessionPromise;

        if (session) {
          // Ya hay sesión guardada: nos saltamos onboarding y login,
          // vamos directo a la pantalla que le corresponde al rol.
          router.replace(routeForRole(session.user?.rol));
        } else {
          router.replace('/(auth)/onboarding');
        }
      }, 2000);
    });

    return () => {
      progressAnim.stopAnimation();
      lidAnim.stopAnimation();
      vaporOpacity.stopAnimation();
      vaporY.stopAnimation();
      textOpacity.stopAnimation();
      card1Opacity.stopAnimation();
      card1Y.stopAnimation();
      card2Opacity.stopAnimation();
      card2Y.stopAnimation();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const lidTranslateY = lidAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80], // exacto del Figma: tapa sube de top:272 → top:192
  });

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/splash.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.85)',
            'rgba(0,0,0,0.30)',
            'rgba(43,30,20,0.75)',
          ]}
          style={styles.gradientOverlay}
        >

          {/* Cloche — estado cerrado como base */}
          <View style={styles.clocheWrapper}>

            {/* Agarradero */}
            <Animated.View
              style={[
                styles.handle,
                { transform: [{ translateY: lidTranslateY }] }
              ]}
            />

            {/* Tapa */}
            <Animated.View
              style={[
                styles.lid,
                { transform: [{ translateY: lidTranslateY }] }
              ]}
            />

            {/* Vapor — Lottie con propiedades exactas del Figma */}
            <Animated.View
              style={[
                styles.vaporContainer,
                {
                  opacity: vaporOpacity,
                  transform: [
                    { translateY: vaporY },
                    { rotate: '-75.59deg' },
                  ],
                }
              ]}
            >
              <Image
                source={require('../../assets/lottie/steam.gif')}
                style={styles.vaporLottie}
                blurRadius={2}
              />
            </Animated.View>

            {/* Base */}
            <View style={styles.base} />

          </View>

          {/* Texto MENÚ DAYS */}
          <Animated.View style={{ opacity: textOpacity }}>
            <Text style={styles.title}>MENÚ</Text>
            <Text style={styles.title}>DAYS</Text>
            <Text style={styles.subtitle}>
              Los mejores restaurantes de{' '}
              <Text style={styles.subtitleHighlight}>Ecuador</Text>
              {' '}en un solo lugar
            </Text>
          </Animated.View>

          {/* Tarjetas */}
          <View style={styles.cardsContainer}>
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: card1Opacity,
                  transform: [{ translateY: card1Y }],
                }
              ]}
            >
              <Text style={styles.cardText}>🍽️ Menú del día</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                {
                  opacity: card2Opacity,
                  transform: [{ translateY: card2Y }],
                }
              ]}
            >
              <Text style={styles.cardText}>🧾 Pedidos</Text>
            </Animated.View>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth }
                ]}
              />
            </View>
          </View>

        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  clocheWrapper: {
    width: 140,
    height: 98,
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  handle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFA726',
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 3,
  },
  lid: {
    width: 140,
    height: 65,
    backgroundColor: '#FFA726',
    borderTopLeftRadius: 65,
    borderTopRightRadius: 65,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'absolute',
    top: 11,
    zIndex: 2,
  },
  base: {
    width: 140,
    height: 16,
    backgroundColor: '#FFA726',
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    zIndex: 2,
  },
  vaporContainer: {
  position: 'absolute',
  width: 145,
  height: 158,
  top: -50,
  left: -10,
  zIndex: 1, 
},
vaporLottie: {
  width: 145,
  height: 158,
  opacity: 0.25,
},
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  subtitleHighlight: {
    color: '#FFA726',
    fontWeight: 'bold',
  },
  cardsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 48,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 6,
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    width: '60%',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#4A4A4A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: 2,
  },
});