import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export default function ScreenHeader({
  title,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
}: ScreenHeaderProps) {
  return (
    <LinearGradient
      colors={["#FFB74D", "#FB8C00"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <SafeAreaView edges={["top"]}>
        <View style={styles.row}>
          {showBack ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={
                onBack ??
                (() => router.replace("/(restaurant)/dashboard"))
              }
              hitSlop={10}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {rightIcon ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onRightPress}
              hitSlop={10}
            >
              <Ionicons
                name={rightIcon}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },

  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonPlaceholder: {
    width: 32,
    height: 32,
  },

  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
});