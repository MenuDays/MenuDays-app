import React, { useMemo } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface ProvinceSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function ProvinceSearch({
    value,
    onChangeText,
    placeholder = "Busca una provincia de Ecuador ...",
    }: ProvinceSearchProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.container}>
        <Ionicons
            name="search-outline"
            size={22}
            color={colors.placeholder}
            style={styles.icon}
        />
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={colors.primary}
            clearButtonMode="while-editing"
        />
        </View>
    );
    }

    const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        width: "100%",
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.inputBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        paddingHorizontal: 16,
        shadowColor: colors.shadow,
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
        paddingVertical: 0,
    },
});