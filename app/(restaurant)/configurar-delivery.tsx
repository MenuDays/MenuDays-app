import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import RestaurantService from "../../services/restaurant.service";
import { AppAlert } from "../components/common/AppAlert";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../contexts/ThemeContext";

const deliveryCharacter = require("../../assets/characters/menudays-delivery.png");

type DeliveryOption = "delivery" | "retiro" | null;

export default function ConfigurarDeliveryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Igual criterio que elegir-categorias.tsx: si venimos de "Mi perfil"
  // (from=perfil) es para EDITAR la configuración ya guardada, así que
  // precargamos el valor actual y al guardar volvemos ahí. Si venimos
  // del flujo de onboarding (recién aprobado, sin from), arranca vacío
  // y al guardar sigue hacia el dashboard.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const cameFromProfile = from === "perfil";

  const [option, setOption] = useState<DeliveryOption>(null);
  const [deliveryName, setDeliveryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(cameFromProfile);

  useEffect(() => {
    if (!cameFromProfile) return;
    RestaurantService.getProfile()
      .then((data) => {
        if (data.ofrece_delivery) {
          setOption("delivery");
          setDeliveryName(data.nombre_delivery ?? "");
        } else {
          setOption("retiro");
        }
      })
      .catch(() => {
        // Sin preselección si falla -- el restaurante igual puede elegir de cero.
      })
      .finally(() => setLoadingCurrent(false));
  }, [cameFromProfile]);

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

      if (cameFromProfile) {
        router.back();
      } else {
        router.replace("/(restaurant)/dashboard");
      }
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

  if (loadingCurrent) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#F5A800" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        style={styles.keyboard}
        contentContainerStyle={styles.content}
        bottomOffset={20}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
          {cameFromProfile && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              hitSlop={10}
            >
              <Ionicons name="close" size={22} color={colors.placeholder} />
            </TouchableOpacity>
          )}

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
                  color={colors.placeholder}
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
                  color={colors.placeholder}
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
                  placeholderTextColor={colors.placeholder}
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
                  color={colors.placeholder}
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
                  color={colors.placeholder}
                />
                <Text style={styles.backButtonText}>
                  Cambiar opción
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    justifyContent: "center",
  },

  closeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    zIndex: 2,
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
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
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
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 3,
  },

  optionDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  formContainer: {
    width: "100%",
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },

  inputContainer: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 15,
    paddingHorizontal: 16,
    backgroundColor: colors.inputBackground,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    marginLeft: 11,
  },

  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },

  retiroContainer: {
    width: "100%",
  },

  retiroInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 20,
  },

  retiroInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});