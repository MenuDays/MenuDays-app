import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { Province } from "../../../services/province.service";

interface ProvinceCardProps {
    province: Province;
    selected: boolean;
    onPress: () => void;
}

export default function ProvinceCard({
                                         province,
                                         selected,
                                         onPress,
                                     }: ProvinceCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[
                styles.card,
                selected && styles.cardSelected,
            ]}
        >
            <View style={styles.leftContent}>
                <Text
                    style={[
                        styles.title,
                        selected && styles.titleSelected,
                    ]}
                    numberOfLines={1}
                >
                    {province.name}
                </Text>
            </View>

            <Ionicons
                name="chevron-forward"
                size={22}
                color={selected ? "#F5A800" : "#BDBDBD"}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        height: 58,

        backgroundColor: "#FFFFFF",

        borderRadius: 14,

        borderWidth: 1,
        borderColor: "#EAEAEA",

        paddingHorizontal: 16,

        marginBottom: 10,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 2,
        },

        elevation: 1,
    },

    cardSelected: {
        borderColor: "#F5A800",
        backgroundColor: "#FFF9EC",
    },

    leftContent: {
        flex: 1,
        marginRight: 10,
    },

    title: {
        fontSize: 15,
        color: "#242424",

        // Cuando carguen Poppins:
        // fontFamily: "Poppins_600SemiBold",
    },

    titleSelected: {
        color: "#D87D00",
    },
});