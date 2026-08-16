import React, { useMemo } from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
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
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const styles = useMemo(() => createStyles(colors, width), [colors, width]);

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
                            ? ["#D8D8D8", "#CFCFCF"]
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

const createStyles = (colors: ThemeColors, width: number) => StyleSheet.create({
    container: {
        width: "100%",
        paddingHorizontal: width * 0.07,
        paddingBottom: 28,
        paddingTop: 10,
        backgroundColor: colors.background,
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

        // Cuando carguen Poppins:
        // fontFamily: "Poppins_700Bold",
    },
});