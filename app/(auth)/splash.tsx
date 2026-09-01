import { View, Text, StyleSheet, Animated, Easing, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as NativeSplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { router, type Href } from 'expo-router';
import { Image } from 'react-native';
import AuthService from '../../services/auth.service';
import LocationService from '../../services/location.service';
import RestaurantDraftStore from '../../services/restaurantDraft.store';


// Adónde mandar a cada rol una vez logueado. Mismo mapeo que usa
// login.tsx después de un login exitoso. Para comensal, "hasLocation"
// decide entre Inicio (ya eligió ciudad antes) o (province) (primera vez).
function routeForRole(rol: string | undefined, hasLocation: boolean): Href {
  if (rol === 'administrador') return '/(admin)/dashboard';
  if (rol === 'restaurante') return '/(restaurant)/dashboard';
  return hasLocation ? '/(home)/(tabs)' : '/(province)';
}

export default function SplashScreen() {
  // Garantiza que la navegación fuera del splash ocurra UNA sola vez,
  // venga del callback de la animación o del timeout de seguridad.
  const hasNavigatedRef = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lidAnim = useRef(new Animated.Value(0)).current;
  const vaporOpacity = useRef(new Animated.Value(0)).current;
  const vaporY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1Y = useRef(new Animated.Value(30)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2Y = useRef(new Animated.Value(30)).current;

  // RESCATE RÁPIDO: si el usuario estaba registrando su restaurante y la
  // app se reinició (Android mata el proceso mientras la cámara está
  // abierta en equipos con poca RAM o "No conservar actividades"), NO se
  // le hace esperar toda la animación del splash: apenas se confirma que
  // hay un borrador reciente, se vuelve derecho al formulario con sus
  // datos. Si no hay borrador, el flujo normal de abajo sigue igual.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await AuthService.getSession();
        if (cancelled || !session) return;
        const rol = session.user?.rol;
        if (rol && rol !== 'comensal') return;
        const hasDraft = await RestaurantDraftStore.hasFreshDraft();
        if (cancelled || !hasDraft || hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;
        NativeSplashScreen.hideAsync().catch(() => {});
        router.replace('/(auth)/register-restaurant');
      } catch {
        // Si algo falla, el flujo normal del splash se encarga.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Chequeo de sesión en paralelo con la animación (no la bloquea):
    // arranca ya y para cuando termine la secuencia de abajo ya
    // tenemos la respuesta lista.
    const sessionPromise = AuthService.getSession();

    // Navegación fuera del splash -- idempotente. La llama tanto el
    // callback de la animación (camino normal) como el timeout de
    // seguridad de abajo (si la animación no completa en un dispositivo
    // lento, o si algo se cuelga). El usuario SIEMPRE termina saliendo
    // del splash.
    async function navigateAway() {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;
      try {
        NativeSplashScreen.hideAsync().catch(() => {});
        const session = await Promise.race([
          sessionPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
        if (session) {
          const rol = session.user?.rol;

          // Si el usuario estaba registrando su restaurante y la app se
          // reinició (Android suele matar el proceso mientras la cámara
          // está abierta), lo devolvemos al formulario con sus datos en
          // vez de dejarlo en Inicio como si nada hubiera pasado.
          if (!rol || rol === 'comensal') {
            const hasDraft = await Promise.race([
              RestaurantDraftStore.hasFreshDraft(),
              new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000)),
            ]);
            if (hasDraft) {
              router.replace('/(auth)/register-restaurant');
              return;
            }
          }

          const savedLocation = await Promise.race([
            LocationService.getUserLocation(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
          ]);
          router.replace(routeForRole(rol, !!savedLocation));
        } else {
          router.replace("/(auth)/onboarding");
        }
      } catch {
        // Pase lo que pase, el usuario tiene que entrar a la app.
        router.replace("/(auth)/onboarding");
      }
    }

    // Red de seguridad: ~4s más que la secuencia completa (~7.6s). Si la
    // animación no dispara su callback en un equipo lento, igual salimos.
    const safetyTimeout = setTimeout(navigateAway, 12000);

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
      setTimeout(navigateAway, 2000);
    });

    return () => {
      clearTimeout(safetyTimeout);
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

  // Oculta el splash nativo recién cuando esta pantalla ya está pintada
  // (la foto de fondo cargó), para que el pase native -> JS no muestre
  // ningún frame en blanco. El timeout es la red de seguridad por si el
  // evento de carga no dispara (imagen cacheada en algunos casos).
  const hideNativeSplash = useCallback(() => {
    NativeSplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(hideNativeSplash, 400);
    return () => clearTimeout(t);
  }, [hideNativeSplash]);

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
        onLoadEnd={hideNativeSplash}
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

          {/* Caption -- texto simple, sin fondo/emoji, estilo iOS. */}
          <View style={styles.captionRow}>
            <Animated.Text
              style={[
                styles.captionText,
                { opacity: card1Opacity, transform: [{ translateY: card1Y }] },
              ]}
            >
              MENÚ DEL DÍA
            </Animated.Text>

            <Animated.Text
              style={[
                styles.captionDot,
                { opacity: card1Opacity, transform: [{ translateY: card1Y }] },
              ]}
            >
              ·
            </Animated.Text>

            <Animated.Text
              style={[
                styles.captionText,
                { opacity: card2Opacity, transform: [{ translateY: card2Y }] },
              ]}
            >
              PEDIDOS
            </Animated.Text>
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
    backgroundColor: '#1A120B',
  },
  background: {
    flex: 1,
    backgroundColor: '#1A120B',
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
    // includeFontPadding TRUE explícito (override del default global
    // includeFontPadding:false): "MENÚ" en mayúsculas grandes con acento
    // necesita ese padding para no recortarse arriba. Deja el splash
    // EXACTAMENTE como está hoy.
    includeFontPadding: true,
    // Android no cuenta el letterSpacing del último caracter al medir el
    // ancho del texto -> la última letra se corta ("DAYS" -> "DAY").
    // El padding le da ese aire de sobra sin descentrar el texto.
    paddingHorizontal: 8,
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
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 48,
  },
  captionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingRight: 2,
  },
  captionDot: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 10,
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