import React from "react";
import { View, TextInput, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

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
    return (
        <View style={styles.container}>
        <Ionicons
            name="search-outline"
            size={22}
            color="#A8A8A8"
            style={styles.icon}
        />
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#B7B7B7"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor="#F5A800"
            clearButtonMode="while-editing"
        />
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        width: width * 0.92,
        height: 56,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E7E7E7",
        paddingHorizontal: 16,
        shadowColor: "#000",
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
        color: "#1A1A1A",
        paddingVertical: 0,
    },
});