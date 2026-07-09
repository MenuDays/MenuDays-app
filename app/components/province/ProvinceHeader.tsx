import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ImageBackground,
    Platform,
    StatusBar,
} from "react-native";

const { width, height } = Dimensions.get("window");

const HEADER_HEIGHT = height * 0.34;

export default function ProvinceHeader() {
    return (
        <View style={styles.container}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />

            <ImageBackground
                source={require("../../../assets/images/encabezado_pizza.png")}
                style={styles.image}
                resizeMode="cover"
            >
                <View style={styles.overlay} />

                <View style={styles.content}>
                    <Text style={styles.title}>
                        ¿Dónde vas a{"\n"}comer hoy?
                    </Text>

                    <Text style={styles.subtitle}>
                        Selecciona tu provincia para descubrir{"\n"}
                        restaurantes y menús del día cercanos.
                    </Text>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: HEADER_HEIGHT,
        overflow: "hidden",
        backgroundColor: "#000",
    },

    image: {
        flex: 1,
        justifyContent: "flex-end",
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.42)",
    },

    content: {
        flex: 1,
        justifyContent: "flex-end",
        paddingHorizontal: width * 0.06,
        paddingBottom: height * 0.045,
        paddingTop:
            Platform.OS === "android"
                ? (StatusBar.currentHeight ?? 0) + 16
                : 56,
    },

    title: {
        color: "#FFFFFF",
        fontSize: Math.min(width * 0.095, 38),
        fontWeight: "700",

        // Cuando carguen Poppins, reemplazar por:
        // fontFamily: "Poppins_700Bold",

        lineHeight: Math.min(width * 0.105, 42),
        maxWidth: width * 0.58,
        marginBottom: 10,
    },

    subtitle: {
        color: "#FFFFFF",
        fontSize: 14,

        // fontFamily: "Poppins_400Regular",

        lineHeight: 21,
        opacity: 0.95,
        maxWidth: width * 0.68,
    },
});