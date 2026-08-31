import React, { useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProvinceCard from "./ProvinceCard";
import { Province } from "../../../services/province.service";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface ProvinceListProps {
    provinces: Province[];
    selectedProvince: Province | null;
    onSelectProvince: (province: Province) => void;
    /** Contenido que va ARRIBA de la lista (imagen + buscador) pero
     * scrollea junto con ella -- así el header no queda fijo comiéndose
     * espacio de la zona de opciones. */
    ListHeaderComponent?: React.ReactElement | null;
}

export default function ProvinceList({
                                         provinces,
                                         selectedProvince,
                                         onSelectProvince,
                                         ListHeaderComponent,
                                     }: ProvinceListProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <FlatList
            style={styles.container}
            data={provinces}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            // Última provincia siempre por encima de la barra del sistema.
            contentContainerStyle={[styles.listContent, { paddingBottom: 20 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
                <>
                    {ListHeaderComponent}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            Provincias de Ecuador
                        </Text>

                        <Text style={styles.counter}>
                            {provinces.length} disponibles
                        </Text>
                    </View>
                </>
            }
            renderItem={({ item }) => (
                <View style={styles.cardWrap}>
                    <ProvinceCard
                        province={item}
                        selected={selectedProvince?.id === item.id}
                        onPress={() => onSelectProvince(item)}
                    />
                </View>
            )}
        />
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",

        marginTop: 24,
        marginBottom: 14,
        paddingHorizontal: 18,
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text,
    },

    counter: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.primary,
    },

    cardWrap: {
        paddingHorizontal: 18,
    },

    listContent: {
        paddingBottom: 20,
        backgroundColor: colors.background,
    },
});