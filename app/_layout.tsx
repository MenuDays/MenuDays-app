import { Stack } from "expo-router";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppAlertProvider } from "./components/common/AppAlert";
import IPhonePreview from "./preview/IPhonePreview";

// PANTALLAS PARA PREVIEW
import RestaurantDashboard from "./(restaurant)/dashboard";
// import RestaurantMenu from "./(restaurant)/menu";
// import RestaurantPerfil from "./(restaurant)/perfil";
// import RestaurantPromociones from "./(restaurant)/promociones";

const WEB_PREVIEW = true;

export default function RootLayout() {
  // 📱 Expo Go / Android / iOS
  if (Platform.OS !== "web") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppAlertProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AppAlertProvider>
      </GestureHandlerRootView>
    );
  }

  // 💻 Web Preview
  if (WEB_PREVIEW) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppAlertProvider>
          <IPhonePreview>
            <RestaurantDashboard />
          </IPhonePreview>
        </AppAlertProvider>
      </GestureHandlerRootView>
    );
  }

  // Web normal (si algún día querés usar Expo Router en web)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppAlertProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AppAlertProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}