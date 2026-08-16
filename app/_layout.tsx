import { Stack } from "expo-router";
import { Platform } from "react-native";

import { AppAlertProvider } from "./components/common/AppAlert";
import { ThemeProvider } from "../contexts/ThemeContext";
import { PreviewModeProvider } from "../contexts/PreviewModeContext";
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
      <ThemeProvider>
        <PreviewModeProvider>
          <AppAlertProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </AppAlertProvider>
        </PreviewModeProvider>
      </ThemeProvider>
    );
  }

  // 💻 Web Preview
  if (WEB_PREVIEW) {
    return (
      <ThemeProvider>
        <PreviewModeProvider>
          <AppAlertProvider>
            <IPhonePreview>
              <RestaurantDashboard />
            </IPhonePreview>
          </AppAlertProvider>
        </PreviewModeProvider>
      </ThemeProvider>
    );
  }

  // Web normal (si algún día querés usar Expo Router en web)
  return (
    <ThemeProvider>
      <PreviewModeProvider>
        <AppAlertProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AppAlertProvider>
      </PreviewModeProvider>
    </ThemeProvider>
  );
}