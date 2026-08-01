import React from "react";
import { View, Text, TextInput, Switch, StyleSheet } from "react-native";
import { RestaurantSchedule } from "../../../services/restaurant.service";

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export default function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: RestaurantSchedule[];
  onChange: (dayId: number, patch: Partial<RestaurantSchedule>) => void;
}) {
  const sorted = [...schedule].sort((a, b) => a.dia_semana - b.dia_semana);

  return (
    <View>
      {sorted.map((day) => (
        <View key={day.id} style={styles.row}>
          <View style={styles.dayLabelRow}>
            <Text style={styles.dayLabel}>{DAY_LABELS[day.dia_semana] ?? `Día ${day.dia_semana}`}</Text>
            <Switch
              value={!day.cerrado}
              onValueChange={(open) => onChange(day.id, { cerrado: !open })}
              trackColor={{ false: "#E0E0E0", true: "#FFD9A0" }}
              thumbColor={!day.cerrado ? "#F5A800" : "#FFFFFF"}
            />
          </View>

          {!day.cerrado ? (
            <View style={styles.timesRow}>
              <TextInput
                style={styles.timeInput}
                value={day.hora_apertura ?? ""}
                onChangeText={(text) => onChange(day.id, { hora_apertura: text })}
                placeholder="09:00"
                placeholderTextColor="#BDBDBD"
              />
              <Text style={styles.timeSeparator}>—</Text>
              <TextInput
                style={styles.timeInput}
                value={day.hora_cierre ?? ""}
                onChangeText={(text) => onChange(day.id, { hora_cierre: text })}
                placeholder="22:00"
                placeholderTextColor="#BDBDBD"
              />
            </View>
          ) : (
            <Text style={styles.closedText}>Cerrado</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayLabel: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  timesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  timeInput: {
    width: 80,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    paddingHorizontal: 10,
    fontSize: 13,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
    textAlign: "center",
  },
  timeSeparator: {
    color: "#BDBDBD",
  },
  closedText: {
    fontSize: 13,
    color: "#9E9E9E",
    marginTop: 6,
  },
});