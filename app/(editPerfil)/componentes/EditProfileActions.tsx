import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  loading?: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditProfileActions({
  loading = false,
  onSave,
  onCancel,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Ionicons
          name="close-circle-outline"
          size={20}
          color="#757575"
        />

        <Text style={styles.cancelText}>
          Cancelar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSave}
        disabled={loading}
        activeOpacity={0.85}
        style={styles.saveTouchable}
      >
        <LinearGradient
          colors={
            loading
              ? ["#D9D9D9", "#CFCFCF"]
              : ["#FFB640", "#F58A07"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveButton}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.saveText}>
                Guardar cambios
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    marginBottom: 35,
    flexDirection: "row",
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    height: 56,

    borderRadius: 18,

    backgroundColor: "#FFFFFF",

    borderWidth: 1.5,
    borderColor: "#E6E6E6",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#757575",
  },

  saveTouchable: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },

  saveButton: {
    height: 56,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});