import { Stack } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

export default function ProvinceLayout() {
    // El fondo del stack seguía al tema: antes estaba fijo en "#F8F8F8"
    // (blanco), así que en modo oscuro se veía un bloque blanco detrás de
    // las listas (que son transparentes) con las cards oscuras encima.
    // `screenSolid` = blanco en claro / negro (#000) en oscuro.
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "fade",
                gestureEnabled: false,
                contentStyle: {
                    backgroundColor: colors.screenSolid,
                },
            }}
        />
    );
}
