import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AuthService from "../../services/auth.service";

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  async function handleRegister() {
  if (password !== confirmPassword) {
    Alert.alert("Error", "Las contraseñas no coinciden.");
    return;
  }

  if (!acceptTerms) {
    Alert.alert(
      "Error",
      "Debés aceptar los términos y condiciones."
    );
    return;
  }

  try {
    const partes = nombre.trim().split(" ");

    await AuthService.register({
      nombre: partes[0],
      apellido: partes.slice(1).join(" ") || "-",
      email,
      password,
    });

    router.replace("/(province)");
  } catch (error: any) {
    Alert.alert(
      "Error",
      error.message || "No se pudo registrar."
    );
  }
}

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
          
          {/* Cloche */}
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
        <Text style={styles.title}>Creá tu cuenta</Text>
        <Text style={styles.subtitle}>Es rápido y fácil</Text>

        {/* Nombre completo */}
        <Text style={styles.label}>Nombre completo</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu nombre completo"
            placeholderTextColor="#9E9E9E"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu email"
            placeholderTextColor="#9E9E9E"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Contraseña */}
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Creá una contraseña"
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

        {/* Confirmar contraseña */}
        <Text style={styles.label}>Confirmar contraseña</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#FFA726" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Repetí tu contraseña"
            placeholderTextColor="#9E9E9E"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#9E9E9E"
            />
          </TouchableOpacity>
        </View>

        {/* Términos y condiciones */}
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAcceptTerms(!acceptTerms)}
        >
          <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
            {acceptTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Text style={styles.termsLink}>Términos y Condiciones</Text>
          </Text>
        </TouchableOpacity>

        {/* Botón registrarse */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
        >
  <LinearGradient
    colors={['#FFB74D', '#FB8C00']}
    start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Registrarme</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>o continuá con</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Botón Google */}
        <TouchableOpacity style={styles.googleButton}>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.googleText}>Continuar con Google</Text>
        </TouchableOpacity>

        {/* Link login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tenés cuenta? </Text>
          <Link href="/(auth)/login">
            <Text style={styles.loginLink}>Iniciá sesión</Text>
          </Link>
        </View>
      </View>
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFA726',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#FFA726',
    borderColor: '#FFA726',
  },
  termsText: {
    fontSize: 13,
    color: '#3E2723',
    flex: 1,
  },
  termsLink: {
    color: '#FFA726',
    fontWeight: '600',
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#757575',
    fontSize: 14,
  },
  loginLink: {
    color: '#FFA726',
    fontSize: 14,
    fontWeight: 'bold',
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