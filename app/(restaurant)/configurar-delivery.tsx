import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RestaurantService from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";

const deliveryCharacter = require("../../assets/characters/menudays-delivery.png");

type DeliveryOption = "delivery" | "retiro" | null;

export default function ConfigurarDeliveryScreen() {
  const [option, setOption] = useState<DeliveryOption>(null);
  const [deliveryName, setDeliveryName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!option) {
      AppAlert.alert(
        "Elige una opción",
        "Indica si tu restaurante ofrece delivery o solo retiro presencial."
      );
      return;
    }

    if (option === "delivery" && !deliveryName.trim()) {
      AppAlert.alert(
        "Falta el nombre",
        "Escribe el nombre de tu servicio de delivery."
      );
      return;
    }

    setSaving(true);

    try {
      if (option === "delivery") {
        await RestaurantService.updateProfile({
          ofreceDelivery: true,
          nombreDelivery: deliveryName.trim(),
        });
      } else {
        await RestaurantService.updateProfile({
          ofreceDelivery: false,
          nombreDelivery: null,
        });
      }

      router.replace("/(restaurant)/dashboard");
    } catch (e: any) {
      console.log("Error configurando delivery:", e);

      AppAlert.alert(
        "No se pudo guardar",
        e?.message || "Ocurrió un error al guardar la configuración."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSelect(optionSelected: DeliveryOption) {
    setOption(optionSelected);

    if (optionSelected === "retiro") {
      setDeliveryName("");
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {/* Personaje */}
          <View style={styles.characterContainer}>
            <Image
              source={deliveryCharacter}
              style={styles.character}
              resizeMode="contain"
            />
          </View>

          {/* Icono */}
          <View style={styles.iconCircle}>
            <Ionicons
              name={option === "retiro" ? "storefront-outline" : "bicycle-outline"}
              size={27}
              color="#F5A800"
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>
            {option === "delivery"
              ? "¡Genial! 🚚"
              : option === "retiro"
              ? "¡Perfecto! 🏠"
              : "¿Ofreces delivery?"}
          </Text>

          {/* Subtítulo */}
          <Text style={styles.subtitle}>
            {option === "delivery"
              ? "¿Cómo se llama tu servicio de delivery?"
              : option === "retiro"
              ? "Tus clientes podrán retirar sus pedidos directamente en el restaurante."
              : "Elige cómo quieres entregar tus pedidos"}
          </Text>

          {/* Paso 1 */}
          {option === null && (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.optionButton}
                onPress={() => handleSelect("delivery")}
              >
                <View style={styles.optionIcon}>
                  <Ionicons
                    name="bicycle-outline"
                    size={23}
                    color="#F5A800"
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>
                    Sí, tengo delivery
                  </Text>
                  <Text style={styles.optionDescription}>
                    Mis clientes pueden recibir sus pedidos.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9E9E9E"
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.optionButton}
                onPress={() => handleSelect("retiro")}
              >
                <View style={styles.optionIcon}>
                  <Ionicons
                    name="storefront-outline"
                    size={23}
                    color="#F5A800"
                  />
                </View>

                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>
                    No, solo retiro
                  </Text>
                  <Text style={styles.optionDescription}>
                    Mis clientes retiran sus pedidos en el local.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9E9E9E"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Paso 2 — Delivery */}
          {option === "delivery" && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>
                Nombre del servicio
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="bicycle-outline"
                  size={21}
                  color="#F5A800"
                />

                <TextInput
                  style={styles.input}
                  value={deliveryName}
                  onChangeText={setDeliveryName}
                  placeholder="Ej: Pedidos Ya"
                  placeholderTextColor="#A7A7A7"
                  maxLength={150}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.helperText}>
                Puede ser un servicio externo o tu propio delivery.
              </Text>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  saving && styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleContinue}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      Guardar
                    </Text>
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setOption(null);
                  setDeliveryName("");
                }}
                disabled={saving}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color="#7A7A7A"
                />
                <Text style={styles.backButtonText}>
                  Volver
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Paso 2 — Retiro */}
          {option === "retiro" && (
            <View style={styles.retiroContainer}>
              <View style={styles.retiroInfo}>
                <Ionicons
                  name="checkmark-circle"
                  size={23}
                  color="#F5A800"
                />

                <Text style={styles.retiroInfoText}>
                  No hace falta configurar ningún servicio de delivery.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  saving && styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleContinue}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      Continuar
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setOption(null)}
                disabled={saving}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color="#7A7A7A"
                />
                <Text style={styles.backButtonText}>
                  Cambiar opción
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
  },

  characterContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 180,
    marginBottom: 4,
  },

  character: {
    width: 180,
    height: 180,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7E8",
    marginBottom: 16,
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#241A15",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#777777",
    textAlign: "center",
    marginTop: 9,
    paddingHorizontal: 18,
    marginBottom: 28,
  },

  optionsContainer: {
    gap: 12,
  },

  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFCF7",
    borderWidth: 1.5,
    borderColor: "#EEE7DD",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },

  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FFF2D5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  optionTextContainer: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#30231C",
    marginBottom: 3,
  },

  optionDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#858585",
  },

  formContainer: {
    width: "100%",
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3E2723",
    marginBottom: 8,
  },

  inputContainer: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E3E3E3",
    borderRadius: 15,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#30231C",
    marginLeft: 11,
  },

  helperText: {
    fontSize: 12,
    color: "#969696",
    marginTop: 8,
    marginBottom: 20,
  },

  primaryButton: {
    height: 53,
    borderRadius: 27,
    backgroundColor: "#F5A800",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  backButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginTop: 8,
  },

  backButtonText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#7A7A7A",
  },

  retiroContainer: {
    width: "100%",
  },

  retiroInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#EEE7DD",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 20,
  },

  retiroInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#665A52",
  },
});