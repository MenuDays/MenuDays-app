import React, { useEffect, useMemo, useState } from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from "expo-router";

import ProvinceHeader from "../components/province/ProvinceHeader";
import ProvinceSearch from "../components/province/ProvinceSearch";
import ProvinceList from "../components/province/ProvinceList";
import ContinueButton from "../components/province/ContinueButton";

import ProvinceService, {
    Province,
} from "../../services/province.service";

export default function ProvinceScreen() {
    const [search, setSearch] = useState("");
    const [selectedProvince, setSelectedProvince] =
        useState<Province | null>(null);
    const [provinces, setProvinces] = useState<Province[]>([]);

    useEffect(() => {
        loadProvinces();
    }, []);

    async function loadProvinces() {
        const data = await ProvinceService.getAll();
        setProvinces(data);
    }

    const filteredProvinces = useMemo(() => {
        if (!search.trim()) return provinces;

        return provinces.filter((province) =>
            province.name
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [search, provinces]);

    async function handleContinue() {
        if (!selectedProvince) return;

        await ProvinceService.saveSelectedProvince(
            selectedProvince
        );

        router.replace("/(home)");
    }

    return (
        <SafeAreaView style={styles.container}>
            <ProvinceHeader />

            <View style={styles.content}>

                <ProvinceSearch
                    value={search}
                    onChangeText={setSearch}
                />

                <ProvinceList
                    provinces={filteredProvinces}
                    selectedProvince={selectedProvince}
                    onSelectProvince={setSelectedProvince}
                />

                <ContinueButton
                    disabled={!selectedProvince}
                    onPress={handleContinue}
                />

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    content: {
        flex: 1,

        backgroundColor: "#FFFFFF",

        marginTop: -28,

        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,

        paddingTop: 20,
        paddingHorizontal: 18,
    },
});