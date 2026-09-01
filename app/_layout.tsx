// PRIMER import de toda la app (bare, solo por su side effect): arregla el
// texto cortado/descentrado en celulares como el Motorola G14 (apaga el
// escalado de fuente del SO + sanea lineHeight/includeFontPadding de cada
// StyleSheet). Va primero para agarrar los estilos de TODO lo que se
// importe después.
import "../utils/textDefaults";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppAlertProvider } from "./components/common/AppAlert";
import { ToastProvider } from "./components/common/Toast";
import AppBackground from "./components/common/AppBackground";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ThemeProvider } from "../contexts/ThemeContext";
import { PreviewModeProvider } from "../contexts/PreviewModeContext";
import { warmUpBackend } from "../services/api";

// Mantiene el splash NATIVO (config de expo-splash-screen en app.json:
// fondo #1A120B + ícono de MenuDays -- ./assets/images/splash-icon.png,
// que AHORA es el ícono real de la marca, antes era el placeholder gris
// de circulitos que trae la plantilla de Expo) visible hasta que la
// primera pantalla real -- la splash animada de (auth)/splash.tsx -- ya
// esté dibujada. Ahí esa pantalla llama a SplashScreen.hideAsync() y el
// pase es sin parpadeo blanco ni logo ajeno.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Fuente propia de la app (Inter) -> el texto se ve IGUAL en todos
  // los dispositivos, sin importar la fuente de sistema de cada marca
  // (Roboto en Motorola/AOSP, One UI en Samsung, etc.). Se aplica a todo
  // <Text>/<TextInput> desde utils/textDefaults.ts. Es la causa de raíz de
  // "se ve bien en un celu y cortado en otro". Inter tiene métricas
  // verticales compactas y estables y diacríticos bien contenidos -> en
  // Android viejo ya no se recorta/descentra el texto (Poppins, geométrica
  // y más alta, era propensa a eso).
  //
  // Los .ttf viven en assets/fonts/ y ADEMÁS están declarados en el plugin
  // "expo-font" de app.json -> en el build nativo quedan EMBEBIDOS en
  // res/assets desde el arranque del proceso (no se cargan async). Eso
  // elimina la ventana en la que, en un Android viejo/lento, la fuente
  // todavía no estaba registrada y el texto se renderizaba con métricas
  // del font de sistema (de ahí el corte/desalineación). Este `useFonts`
  // se mantiene para la Device Preview web (donde el plugin no aplica) y
  // como red de seguridad; en nativo resuelve al instante.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
    Inter_400Regular_Italic: require("../assets/fonts/Inter_400Regular_Italic.ttf"),
    Inter_500Medium: require("../assets/fonts/Inter_500Medium.ttf"),
    Inter_600SemiBold: require("../assets/fonts/Inter_600SemiBold.ttf"),
    Inter_700Bold: require("../assets/fonts/Inter_700Bold.ttf"),
    Inter_800ExtraBold: require("../assets/fonts/Inter_800ExtraBold.ttf"),
    Inter_900Black: require("../assets/fonts/Inter_900Black.ttf"),
  });

  // El back vive en Railway y se "duerme" sin tráfico -- la primera
  // petición real (ej. al entrar a una pantalla) puede tardar varios
  // segundos en despertarlo, y esa pantalla se siente "trabada"
  // cargando. Disparar un ping liviano apenas arranca la app (sin
  // esperarlo, sin mostrar nada) le da ventaja: para cuando el usuario
  // realmente navega a una pantalla con datos, el contenedor ya está
  // despierto la mayoría de las veces.
  useEffect(() => {
    warmUpBackend();
  }, []);

  // KeyboardProvider solo tiene sentido en nativo (react-native-keyboard-
  // controller no tiene módulo nativo en web, y sus componentes ya
  // quedan inertes ahí sin este Provider). El resto del árbol -- Stack,
  // temas, alerts -- es idéntico en las 3 plataformas: la Device Preview
  // web navega por el mismo <Stack> de Expo Router que Android/iOS, no
  // por una pantalla fija, para poder probar la app completa.
  const tree = (
    <SafeAreaProvider>
      <ThemeProvider>
        <PreviewModeProvider>
          <AppAlertProvider>
            <ToastProvider>
              <AppBackground>
                {/* Boundary interno: si una PANTALLA tira un error de
                    render, se muestra la pantalla de "Algo salió mal" sin
                    tirar abajo los providers (tema, alerts, safe area). */}
                <ErrorBoundary>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      // Transparente para dejar ver el patrón global de
                      // AppBackground (modo claro). En oscuro AppBackground
                      // pinta el fondo sólido del tema.
                      contentStyle: { backgroundColor: "transparent" },
                    }}
                  />
                </ErrorBoundary>
              </AppBackground>
            </ToastProvider>
          </AppAlertProvider>
        </PreviewModeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );

  // Hasta que Inter cargue, no montamos nada -> el splash NATIVO
  // (expo-splash-screen) sigue tapando la pantalla, sin flash de texto en
  // la fuente de sistema. Inter carga de assets locales -> es un
  // instante. Si falla la carga, seguimos igual con la fuente de sistema.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Boundary EXTERNO: última red de seguridad -- cubre incluso un
          fallo de un Provider o del KeyboardProvider. */}
      <ErrorBoundary>
        {Platform.OS === "web" ? tree : <KeyboardProvider>{tree}</KeyboardProvider>}
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}