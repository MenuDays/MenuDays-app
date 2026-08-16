import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from "expo-router";
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from "../../services/auth.service";
import CategoryService from "../../services/category.service";
import LocationService from "../../services/location.service";
import { AppAlert } from "../components/common/AppAlert";
import ThemeChoiceModal from "../components/common/ThemeChoiceModal";
import { useTheme } from "../../contexts/ThemeContext";
import type { Href } from "expo-router";

const THEME_PROMPT_SHOWN_KEY = "@MenuDays:themePromptShown";

const { width } = Dimensions.get('window');

const CATEGORIES = [
  {
    id: 1,
    name: 'Hamburguesas',
    image: require('../../assets/images/burger.png'),
    lottie: require('../../assets/lottie/burger.json'),
  },
  {
    id: 2,
    name: 'Pizzas',
    image: require('../../assets/images/pizza.png'),
    lottie: require('../../assets/lottie/pizza.json'),
  },
  {
    id: 3,
    name: 'Sushi',
    image: require('../../assets/images/sushi.png'),
    lottie: require('../../assets/lottie/sushi.json'),
  },
  {
    id: 4,
    name: 'Tacos',
    image: require('../../assets/images/tacos.png'),
    lottie: require('../../assets/lottie/tacos.json'),
  },
  {
    id: 5,
    name: 'Y mucho más',
    image: require('../../assets/images/plus.png'),
    lottie: require('../../assets/lottie/plus.json'),
  },
];

export default function LoginScreen() {
  const { refreshRole, setMode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [themePromptVisible, setThemePromptVisible] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  // Adónde navegar una vez resuelto (y cerrado, si corresponde) el
  // cartelito de elegir tema -- ver handleThemeChoice más abajo.
  const pendingDestination = useRef<Href | null>(null);

  function goToPendingDestination() {
    if (pendingDestination.current) {
      router.replace(pendingDestination.current);
      pendingDestination.current = null;
    }
  }

  async function handleThemeChoice(chosen: "light" | "dark") {
    setMode(chosen);
    await AsyncStorage.setItem(THEME_PROMPT_SHOWN_KEY, "true").catch(() => {});
    setThemePromptVisible(false);
    goToPendingDestination();
  }

  async function handleLogin() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await AuthService.login({
        email,
        password,
      });

      const rol = response.user?.rol;

      // El lock de Dark Mode (solo comensal) se decide por el rol
      // guardado en AsyncStorage -- sin esto, si alguien cierra sesión de
      // un restaurante/admin y entra como comensal en la misma instancia
      // de la app, el tema seguiría forzado en Light hasta un remount.
      refreshRole();

      if (rol === "administrador") {
        router.replace("/(admin)/dashboard");
      } else if (rol === "restaurante") {
        // Si el restaurante todavía no eligió sus categorías, lo
        // mandamos primero a esa pantalla (obligatoria) antes del
        // dashboard. Si la llamada falla por lo que sea, no bloqueamos
        // el login: lo dejamos entrar igual y ya podrá elegirlas desde
        // "Mi perfil" más tarde.
        try {
          const myCategories = await CategoryService.getRestaurantCategories();
          if (myCategories.length === 0) {
            router.replace("/(restaurant)/elegir-categorias");
          } else {
            router.replace("/(restaurant)/dashboard");
          }
        } catch {
          router.replace("/(restaurant)/dashboard");
        }
      } else {
        // comensal (o cualquier otro caso no contemplado). Si ya eligió
        // ciudad/ubicación en una sesión anterior (queda guardada en el
        // dispositivo, ver LocationService), no lo volvemos a mandar a
        // elegirla -- entra directo a Inicio. Solo la primera vez (o si
        // la borró desde Perfil) pasa por (province).
        const savedLocation = await LocationService.getUserLocation();
        pendingDestination.current = savedLocation ? "/(home)" : "/(province)";

        // Solo comensal puede usar Dark Mode, así que el cartelito de
        // "¿claro u oscuro?" también es solo para comensal, y solo la
        // primera vez que loguea en este dispositivo.
        const themePromptShown = await AsyncStorage.getItem(THEME_PROMPT_SHOWN_KEY);
        if (!themePromptShown) {
          setLoading(false);
          setThemePromptVisible(true);
          return;
        }

        goToPendingDestination();
      }
    } catch (error: any) {
      // Keyboard.dismiss() solo esconde el teclado nativo, pero NO hace
      // blur del TextInput enfocado -- el input se queda "focused" a
      // nivel de React aunque el teclado ya no esté. Si el usuario vuelve
      // a tocar ESE MISMO input, no se dispara un nuevo evento onFocus
      // (ya estaba enfocado), así que KeyboardAwareScrollView nunca
      // vuelve a hacer scroll para mostrarlo y el campo queda tapado por
      // el teclado. Por eso acá hacemos blur() explícito de los dos
      // inputs (que de paso cierra el teclado) para que el próximo tap
      // dispare un onFocus real y el scroll se recalcule bien.
      emailInputRef.current?.blur();
      passwordInputRef.current?.blur();
      AppAlert.alert(
        "Error",
        error.message || "No se pudo iniciar sesión."
      );
      setLoading(false);
    }
    // No hago setLoading(false) en el caso de éxito a propósito: la
    // pantalla se desmonta por el router.replace, y dejar loading=true
    // evita un parpadeo del botón/mascota mientras navega.
  }

  // Auto carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % CATEGORIES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = CATEGORIES[currentIndex];

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      bottomOffset={20}
      bounces={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Parte superior con carrusel */}
      <ImageBackground
        source={current.image}
        style={styles.header}
      >
        <View style={styles.overlay} />

        <View style={styles.headerContent}>
          <Text style={styles.menuTitle}>MENÚ</Text>
          <Text style={styles.menuTitle}>DAYS</Text>

          {/* Lottie animado */}
          <LottieView
            source={current.lottie}
            autoPlay
            loop
            style={styles.lottie}
          />

          <Text style={styles.categoryText}>{current.name}</Text>

          {/* Indicadores */}
          <View style={styles.indicators}>
            {CATEGORIES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.indicator,
                  i === currentIndex && styles.indicatorActive
                ]}
              />
            ))}
          </View>
        </View>
      </ImageBackground>

      {/* Card blanca */}
      <View style={styles.card}>
        <Text style={styles.welcome}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        {/* Campo Email */}
        <Text style={styles.label}>Email o Teléfono</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder="Ingresa tu email o teléfono"
            placeholderTextColor="#9E9E9E"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Campo Contraseña */}
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#9E9E9E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#9E9E9E"
            />
          </TouchableOpacity>
        </View>

        

        {/* Botón iniciar sesión */}
        <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
        >
          <LinearGradient
              colors={['#FFB74D', '#FB8C00']}
              style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Link registro */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿No tienes cuenta? </Text>
          <Link href="/(auth)/register">
            <Text style={styles.registerLink}>Registrate</Text>
          </Link>
        </View>
      </View>

      {/* Overlay con la mascota mientras se espera la respuesta del login */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <Image
            source={require('../../assets/images/login-nene.png')}
            style={styles.loadingMascot}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>Iniciando sesión...</Text>
        </View>
      </Modal>

      <ThemeChoiceModal visible={themePromptVisible} onChoose={handleThemeChoice} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 380,
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
  lottie: {
    width: 100,
    height: 100,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 4,
  },
  indicators: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: '#FFA726',
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
  welcome: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3E2723',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3E2723',
    marginBottom: 8,
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
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#FFA726',
    fontSize: 13,
  },
  button: {
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMascot: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    color: '#757575',
    fontSize: 13,
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 24,
    gap: 10,
  },
  googleText: {
    fontSize: 15,
    color: '#3E2723',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#757575',
    fontSize: 14,
  },
  registerLink: {
    color: '#FFA726',
    fontSize: 14,
    fontWeight: 'bold',
  },
});