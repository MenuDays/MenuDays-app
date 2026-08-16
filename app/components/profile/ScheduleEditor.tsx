import React from "react";
import { View, Text, TextInput, Switch, StyleSheet } from "react-native";
import { RestaurantSchedule } from "../../../services/restaurant.service";
import { useTheme } from "../../../contexts/ThemeContext";

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
  const { colors } = useTheme();
  const sorted = [...schedule].sort((a, b) => a.dia_semana - b.dia_semana);

  return (
    <View>
      {sorted.map((day) => (
        <View key={day.id} style={[styles.row, { borderBottomColor: colors.divider }]}>
          <View style={styles.dayLabelRow}>
            <Text style={[styles.dayLabel, { color: colors.text }]}>
              {DAY_LABELS[day.dia_semana] ?? `Día ${day.dia_semana}`}
            </Text>
            <Switch
              value={!day.cerrado}
              onValueChange={(open) => onChange(day.id, { cerrado: !open })}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={!day.cerrado ? colors.primary : colors.card}
            />
          </View>

          {!day.cerrado ? (
            <View style={styles.timesRow}>
              <TextInput
                style={[
                  styles.timeInput,
                  { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground },
                ]}
                value={day.hora_apertura ?? ""}
                onChangeText={(text) => onChange(day.id, { hora_apertura: text })}
                placeholder="09:00"
                placeholderTextColor={colors.placeholder}
              />
              <Text style={[styles.timeSeparator, { color: colors.placeholder }]}>—</Text>
              <TextInput
                style={[
                  styles.timeInput,
                  { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground },
                ]}
                value={day.hora_cierre ?? ""}
                onChangeText={(text) => onChange(day.id, { hora_cierre: text })}
                placeholder="22:00"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          ) : (
            <Text style={[styles.closedText, { color: colors.textSecondary }]}>Cerrado</Text>
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
  },
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayLabel: {
    fontSize: 14.5,
    fontWeight: "700",
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
    paddingHorizontal: 10,
    fontSize: 13,
    textAlign: "center",
  },
  timeSeparator: {},
  closedText: {
    fontSize: 13,
    marginTop: 6,
  },
});
