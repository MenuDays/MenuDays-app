import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppAlertProvider } from "./components/common/AppAlert";


export default function RootLayout() {

  //useEffect(() => {
  //  if (__DEV__) {
   //   runApiDiagnostics();
   // }
//  }, []);

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