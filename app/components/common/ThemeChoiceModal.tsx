import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

interface ThemeChoiceModalProps {
  visible: boolean;
  onChoose: (mode: "light" | "dark") => void;
}

// Cartelito que se muestra una sola vez, la primera vez que un comensal
// inicia sesión, para que elija si prefiere la app en modo claro u
// oscuro (después puede cambiarlo cuando quiera desde Perfil con
// ThemeToggle). Ver flag "@MenuDays:themePromptShown" en login.tsx.
export default function ThemeChoiceModal({ visible, onChoose }: ThemeChoiceModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>¿Cómo querés ver la app?</Text>
          <Text style={styles.subtitle}>
            Podés cambiarlo cuando quieras desde tu perfil.
          </Text>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.85}
              onPress={() => onChoose("light")}
            >
              <View style={[styles.iconCircle, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="sunny" size={26} color="#FB8C00" />
              </View>
              <Text style={styles.optionText}>Modo claro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.85}
              onPress={() => onChoose("dark")}
            >
              <View style={[styles.iconCircle, { backgroundColor: "#1C1C1C" }]}>
                <Ionicons name="moon" size={24} color="#FFB74D" />
              </View>
              <Text style={styles.optionText}>Modo oscuro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },
    card: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: colors.modalBackground,
      borderRadius: 24,
      paddingTop: 24,
      paddingBottom: 22,
      paddingHorizontal: 22,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 12.5,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 20,
    },
    optionsRow: {
      flexDirection: "row",
      gap: 14,
      width: "100%",
    },
    option: {
      flex: 1,
      alignItems: "center",
      gap: 10,
      paddingVertical: 16,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    optionText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
  });
