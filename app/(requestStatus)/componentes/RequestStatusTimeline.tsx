import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import type { ThemeColors } from "../../../contexts/ThemeContext";

type RequestStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada";

interface Props {
  status: RequestStatus;
}

export default function RequestStatusTimeline({
  status,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      {/* Pendiente */}
      <View style={styles.stepContainer}>
        <View
          style={[
            styles.circle,
            styles.pendingCircle,
          ]}
        >
          <Ionicons
            name="time"
            size={18}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={[
            styles.label,
            status === "pendiente" &&
              styles.activeLabel,
          ]}
        >
          Pendiente
        </Text>
      </View>

      <View
        style={[
          styles.line,
          status !== "pendiente" &&
            styles.activeGreenLine,
        ]}
      />

      {/* Aprobada */}
      <View style={styles.stepContainer}>
        <View
          style={[
            styles.circle,
            status === "aprobada"
              ? styles.approvedCircle
              : styles.inactiveCircle,
          ]}
        >
          <Ionicons
            name="checkmark"
            size={18}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={[
            styles.label,
            status === "aprobada" &&
              styles.activeLabel,
          ]}
        >
          Aprobada
        </Text>
      </View>

      <View
        style={[
          styles.line,
          status === "rechazada" &&
            styles.activeRedLine,
        ]}
      />

      {/* Rechazada */}
      <View style={styles.stepContainer}>
        <View
          style={[
            styles.circle,
            status === "rechazada"
              ? styles.rejectedCircle
              : styles.inactiveCircle,
          ]}
        >
          <Ionicons
            name="close"
            size={18}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={[
            styles.label,
            status === "rechazada" &&
              styles.activeLabel,
          ]}
        >
          Rechazada
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },

  stepContainer: {
    alignItems: "center",
    width: 82,
  },

  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,

    justifyContent: "center",
    alignItems: "center",
  },

  pendingCircle: {
    backgroundColor: "#F5A800",
  },

  approvedCircle: {
    backgroundColor: "#43A047",
  },

  rejectedCircle: {
    backgroundColor: "#E53935",
  },

  inactiveCircle: {
    backgroundColor: colors.border,
  },

  line: {
    flex: 1,
    height: 4,

    borderRadius: 2,

    backgroundColor: colors.divider,

    marginHorizontal: 6,
    marginBottom: 24,
  },

  activeGreenLine: {
    backgroundColor: "#43A047",
  },

  activeRedLine: {
    backgroundColor: "#E53935",
  },

  label: {
    marginTop: 10,

    fontSize: 13,
    fontWeight: "500",

    color: colors.placeholder,

    textAlign: "center",
  },

  activeLabel: {
    color: colors.text,
    fontWeight: "700",
  },
});