import { Stack } from "expo-router";


export default function RootLayout() {

  //useEffect(() => {
  //  if (__DEV__) {
   //   runApiDiagnostics();
   // }
//  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}