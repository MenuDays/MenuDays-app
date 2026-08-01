import { Stack } from "expo-router";
import { AppAlertProvider } from "./components/common/AppAlert";


export default function RootLayout() {

  //useEffect(() => {
  //  if (__DEV__) {
   //   runApiDiagnostics();
   // }
//  }, []);

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