import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import KeyboardAvoidingScreen from "../components/common/KeyboardAvoidingScreen";
import ContinueButton from "../components/province/ContinueButton";
import ProvinceHeader from "../components/province/ProvinceHeader";
import ProvinceList from "../components/province/ProvinceList";
import ProvinceSearch from "../components/province/ProvinceSearch";

import ProvinceService, {
    Province,
} from "../../services/province.service";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";
import { showLocationError, isNetworkError } from "../utils/locationErrors";

export default function ProvinceScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [search, setSearch] = useState("");
    const [selectedProvince, setSelectedProvince] =
        useState<Province | null>(null);
    const [provinces, setProvinces] = useState<Province[]>([]);

    useEffect(() => {
        loadProvinces();
    }, []);

    async function loadProvinces() {
        try {
            const data = await ProvinceService.getAll();
            setProvinces(data);
        } catch (error) {
            console.error("Error al cargar provincias:", error);
            showLocationError(
                isNetworkError(error) ? "networkError" : "genericError",
                loadProvinces
            );
        }
    }

    const filteredProvinces = useMemo(() => {
        if (!search.trim()) return provinces;

        return provinces.filter((province) =>
            province.nombre
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [search, provinces]);

    async function handleContinue() {
        if (!selectedProvince) {
            showLocationError("missingProvince");
            return;
        }

        await ProvinceService.saveSelectedProvince(selectedProvince);

        router.push({
            pathname: "/(province)/city",
            params: {
                provinceId: selectedProvince.id,
                provinceName: selectedProvince.nombre,
            },
        });
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingScreen>
            <ProvinceList
                provinces={filteredProvinces}
                selectedProvince={selectedProvince}
                onSelectProvince={setSelectedProvince}
                ListHeaderComponent={
                    <>
                        <ProvinceHeader />
                        <View style={styles.searchWrap}>
                            <ProvinceSearch
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                    </>
                }
            />

            <ContinueButton
                disabled={!selectedProvince}
                onPress={handleContinue}
            />
            </KeyboardAvoidingScreen>
        </SafeAreaView>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    searchWrap: {
        backgroundColor: colors.background,
        marginTop: -28,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        paddingHorizontal: 18,
    },
});