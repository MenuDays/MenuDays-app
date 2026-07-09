import React from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
} from "react-native";

import ProvinceCard from "./ProvinceCard";
import { Province } from "../../../services/province.service";

interface ProvinceListProps {
    provinces: Province[];
    selectedProvince: Province | null;
    onSelectProvince: (province: Province) => void;
}

export default function ProvinceList({
                                         provinces,
                                         selectedProvince,
                                         onSelectProvince,
                                     }: ProvinceListProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    Provincias de Ecuador
                </Text>

                <Text style={styles.counter}>
                    {provinces.length} disponibles
                </Text>
            </View>

            <FlatList
                data={provinces}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <ProvinceCard
                        province={item}
                        selected={selectedProvince?.id === item.id}
                        onPress={() => onSelectProvince(item)}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 24,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",

        marginBottom: 14,
        paddingHorizontal: 4,
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A1A1A",

        // fontFamily: "Poppins_700Bold",
    },

    counter: {
        fontSize: 12,
        fontWeight: "600",
        color: "#F5A800",

        // fontFamily: "Poppins_600SemiBold",
    },

    listContent: {
        paddingBottom: 20,
    },
});