import React, { useMemo } from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface ContinueButtonProps {
    disabled: boolean;
    onPress: () => void;
}

export default function ContinueButton({
                                           disabled,
                                           onPress,
                                       }: ContinueButtonProps) {
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();
    // Inset inferior REAL del dispositivo: en un teléfono con barra de 3
    // botones puede ser ~48px; con gestos, ~0-24. Antes el padding era
    // fijo (28) y no alcanzaba -> en Android viejo el botón (y con él el
    // final de la lista de cantones) quedaba tapado por la barra del
    // sistema. Ahora el padding sigue al inset real.
    const insets = useSafeAreaInsets();
    const styles = useMemo(
        () => createStyles(colors, width, insets.bottom),
        [colors, width, insets.bottom]
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.92}
                onPress={onPress}
                style={styles.touchable}
            >
                <LinearGradient
                    colors={
                        disabled
                            ? isDark
                                ? ["#2A2A2A", "#242424"]
                                : ["#D8D8D8", "#CFCFCF"]
                            : ["#FFB640", "#F58A07"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                >
                    <Text style={styles.text}>
                        Comenzar
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const createStyles = (colors: ThemeColors, width: number, bottomInset: number) => StyleSheet.create({
    container: {
        width: "100%",
        paddingHorizontal: width * 0.07,
        // 20 de aire de base + el inset real de la barra del sistema
        // (mínimo 28 para no perder el espaciado original en gestos).
        paddingBottom: Math.max(28, bottomInset + 20),
        paddingTop: 10,
        backgroundColor: colors.surface,
    },

    touchable: {
        borderRadius: 30,
    },

    button: {
        height: 56,
        borderRadius: 30,

        justifyContent: "center",
        alignItems: "center",

        shadowColor: "#F5A800",
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: {
            width: 0,
            height: 6,
        },

        elevation: 6,
    },

    text: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",

        // fontFamily la aplica utils/textDefaults.ts (Inter_700Bold por el fontWeight 700).
    },
});