import { Stack } from "expo-router";
import { Platform } from "react-native";
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
      <AppAlertProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AppAlertProvider>
    );
  }

  // 💻 Web Preview
  if (WEB_PREVIEW) {
    return (
      <AppAlertProvider>
        <IPhonePreview>
          <RestaurantDashboard />
        </IPhonePreview>
      </AppAlertProvider>
    );
  }

  // Web normal (si algún día querés usar Expo Router en web)
  return (
    <SafeAreaProvider>
      <AppAlertProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AppAlertProvider>
    </SafeAreaProvider>
  );
}