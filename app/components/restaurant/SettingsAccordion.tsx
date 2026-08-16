import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SettingsAccordionProps {
  deliveryName: string | null;
  offersDelivery: boolean;
  onDeliveryPress: () => void;
}

export default function SettingsAccordion({
  deliveryName,
  offersDelivery,
  onDeliveryPress,
}: SettingsAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      {/* ===================================================== */}
      {/* CABECERA                                               */}
      {/* ===================================================== */}

      <TouchableOpacity
        style={[
          styles.header,
          expanded && styles.headerExpanded,
        ]}
        activeOpacity={0.9}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <View style={styles.headerIcon}>
          <Ionicons
            name="settings-outline"
            size={20}
            color="#D99000"
          />
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Configuraciones
          </Text>

          <Text style={styles.headerSubtitle}>
            Administra las opciones de tu restaurante
          </Text>
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={17}
            color="#716C67"
          />
        </View>
      </TouchableOpacity>

      {/* ===================================================== */}
      {/* OPCIONES                                               */}
      {/* ===================================================== */}

      {expanded && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.88}
            onPress={onDeliveryPress}
          >
            {/* Icono */}
            <View style={styles.optionIcon}>
              <Ionicons
                name="bicycle-outline"
                size={21}
                color="#D99000"
              />
            </View>

            {/* Información */}
            <View style={styles.optionTextContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.optionTitle}>
                  Delivery
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    offersDelivery
                      ? styles.statusActive
                      : styles.statusInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      offersDelivery
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      offersDelivery
                        ? styles.statusTextActive
                        : styles.statusTextInactive,
                    ]}
                  >
                    {offersDelivery ? "Activo" : "Inactivo"}
                  </Text>
                </View>
              </View>

              <Text
                style={styles.optionDescription}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {offersDelivery
                  ? deliveryName
                    ? deliveryName
                    : "Servicio de delivery configurado"
                  : "Solo retiro presencial"}
              </Text>
            </View>

            {/* Flecha */}
            <Ionicons
              name="chevron-forward"
              size={17}
              color="#B0AAA4"
              style={styles.arrow}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // =========================================================
  // CONTENEDOR
  // =========================================================

  container: {
    marginTop: 18,
    marginHorizontal: 16,
    marginBottom: 12,
  },

  // =========================================================
  // HEADER
  // =========================================================

  header: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E9E3DB",

    borderRadius: 18,

    paddingHorizontal: 14,
    paddingVertical: 13,

    shadowColor: "#2B211A",
    shadowOpacity: 0.045,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  headerExpanded: {
    borderColor: "#E4D8C6",
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
  },

  headerIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: "#FFF8EA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#302820",
    marginBottom: 3,
  },

  headerSubtitle: {
    fontSize: 11.8,
    lineHeight: 17,
    color: "#8A847D",
  },

  chevronContainer: {
    width: 30,
    height: 30,

    borderRadius: 9,

    backgroundColor: "#F8F6F3",

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 8,
  },

  // =========================================================
  // CONTENEDOR DE OPCIONES
  // =========================================================

  optionsContainer: {
    marginTop: 5,

    backgroundColor: "#F9F7F4",

    borderWidth: 1,
    borderColor: "#E9E3DB",

    borderRadius: 15,

    padding: 6,

    shadowColor: "#2B211A",
    shadowOpacity: 0.035,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 1,
  },

  // =========================================================
  // OPCIÓN DELIVERY
  // =========================================================

  option: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 12,

    paddingHorizontal: 10,
    paddingVertical: 10,

    minHeight: 66,
  },

  optionIcon: {
    width: 40,
    height: 40,

    borderRadius: 12,

    backgroundColor: "#FFF8EA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  optionTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 3,
  },

  optionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#302820",
  },

  optionDescription: {
    fontSize: 11.5,
    lineHeight: 16,

    color: "#89837C",

    flexShrink: 1,
  },

  // =========================================================
  // ESTADO
  // =========================================================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",

    marginLeft: 8,

    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 20,
  },

  statusActive: {
    backgroundColor: "#F1F7ED",
  },

  statusInactive: {
    backgroundColor: "#F2F1EF",
  },

  statusDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    marginRight: 5,
  },

  dotActive: {
    backgroundColor: "#6E9E4B",
  },

  dotInactive: {
    backgroundColor: "#98928C",
  },

  statusText: {
    fontSize: 9.5,
    fontWeight: "800",
  },

  statusTextActive: {
    color: "#5E8B41",
  },

  statusTextInactive: {
    color: "#77716B",
  },

  // =========================================================
  // FLECHA
  // =========================================================

  arrow: {
    marginLeft: 7,
  },
});