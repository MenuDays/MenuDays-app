import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { RestaurantSchedule } from "../../../services/restaurant.service";
import { useTheme } from "../../../contexts/ThemeContext";
import { normalizeTimeInput } from "../../../utils/timeFormat";
import { normalizeSchedule } from "../../../utils/restaurantSchedule";

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const DAY_SHORT: Record<number, string> = {
  1: "L",
  2: "M",
  3: "X",
  4: "J",
  5: "V",
  6: "S",
  7: "D",
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7];

// "Lunes a Viernes" si son consecutivos, "Sábado, Domingo" si no --
// mucho más legible que listar 7 filas sueltas.
function formatDayRange(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  const isConsecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (isConsecutive && sorted.length > 1) {
    return `${DAY_LABELS[sorted[0]]} a ${DAY_LABELS[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => DAY_LABELS[d]).join(", ");
}

interface ScheduleGroup {
  key: string;
  days: number[];
  hora_apertura: string | null;
  hora_cierre: string | null;
  cerrado: boolean;
}

// Agrupa los 7 días por horario IDÉNTICO -- puramente derivado de
// `schedule`, no es estado propio: así el resumen siempre refleja
// exactamente lo que ya se guardó/está por guardarse, sin duplicar
// fuente de verdad.
function groupSchedule(schedule: RestaurantSchedule[]): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>();
  for (const day of schedule) {
    const key = day.cerrado ? "cerrado" : `${day.hora_apertura ?? ""}-${day.hora_cierre ?? ""}`;
    const existing = groups.get(key);
    if (existing) {
      existing.days.push(day.dia_semana);
    } else {
      groups.set(key, {
        key,
        days: [day.dia_semana],
        hora_apertura: day.hora_apertura,
        hora_cierre: day.hora_cierre,
        cerrado: day.cerrado,
      });
    }
  }
  return Array.from(groups.values()).sort((a, b) => Math.min(...a.days) - Math.min(...b.days));
}

// Este editor sigue exponiendo exactamente la misma interfaz de siempre
// (schedule + onChange por día) -- las pantallas que lo usan no
// necesitan tocar nada. Por dentro cambia la UX: en vez de 7 filas para
// completar una por una, se eligen los días que comparten horario con
// chips y se completa UNA sola vez -- mucho más rápido si (como pasa
// casi siempre) varios días tienen el mismo horario.
export default function ScheduleEditor({
  schedule,
  onChange,
  hideClosed = false,
}: {
  schedule: RestaurantSchedule[];
  onChange: (dayId: number, patch: Partial<RestaurantSchedule>) => void;
  // Registro de restaurante: ahí "Cerrado" no es un concepto -- el
  // restaurante simplemente elige los días que ATIENDE y su horario; los
  // días que no elige quedan sin atención. Con esto se oculta el switch
  // "Cerrado" y el resumen habla de "días de atención" en vez de
  // mostrar 7 filas "Cerrado" al abrir. En editar-perfil sigue igual
  // que siempre (hideClosed = false).
  hideClosed?: boolean;
}) {
  const { colors } = useTheme();
  // Trabajamos SIEMPRE con los 7 días canónicos (Lunes..Domingo). Si el
  // padre pasó menos días, o el domingo como 0, acá se completa/canoniza
  // -- así los 7 días (domingo incluido) se editan y guardan igual.
  // Es idempotente: si el padre ya normalizó, esto no cambia nada.
  const days = useMemo(() => normalizeSchedule(schedule), [schedule]);
  const groups = useMemo(() => groupSchedule(days), [days]);

  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [draftOpen, setDraftOpen] = useState("09:00");
  const [draftClose, setDraftClose] = useState("22:00");
  const [draftClosed, setDraftClosed] = useState(false);

  function toggleDay(dia: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dia)) next.delete(dia);
      else next.add(dia);
      return next;
    });
  }

  function loadGroupIntoDraft(group: ScheduleGroup) {
    setSelectedDays(new Set(group.days));
    setDraftOpen(group.hora_apertura ?? "09:00");
    setDraftClose(group.hora_cierre ?? "22:00");
    setDraftClosed(group.cerrado);
  }

  function handleBlurOpen() {
    const normalized = normalizeTimeInput(draftOpen);
    if (normalized) setDraftOpen(normalized);
  }

  function handleBlurClose() {
    const normalized = normalizeTimeInput(draftClose);
    if (normalized) setDraftClose(normalized);
  }

  // En modo registro no existe "cerrado": aplicar SIEMPRE fija un horario
  // de atención.
  const applyAsClosed = hideClosed ? false : draftClosed;

  function applyToSelectedDays() {
    if (selectedDays.size === 0) return;
    // `days` ya tiene los 7 días -> el `.get()` nunca falla (antes, si el
    // día no estaba en `schedule`, se salteaba en silencio: el bug del
    // domingo). Se ordena para que el patch se aplique de Lunes a Domingo.
    const idByDay = new Map(days.map((d) => [d.dia_semana, d.id]));
    Array.from(selectedDays)
      .sort((a, b) => a - b)
      .forEach((dia) => {
        const id = idByDay.get(dia);
        if (id === undefined) return;
        onChange(
          id,
          applyAsClosed
            ? { cerrado: true }
            : { cerrado: false, hora_apertura: draftOpen, hora_cierre: draftClose }
        );
      });
    setSelectedDays(new Set());
  }

  // En modo registro: los días con atención (para el resumen) y los que
  // todavía no se configuraron.
  const openGroups = groups.filter((g) => !g.cerrado);
  const closedDays = days.filter((d) => d.cerrado).map((d) => d.dia_semana);

  return (
    <View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {hideClosed
          ? "Elige los días que tu restaurante atiende y define su horario. Los días que no elijas quedan sin atención. Si un grupo de días comparte horario (ej. lunes a viernes) márcalos juntos y complétalo una sola vez."
          : "Elige los días que comparten el mismo horario y complétalo una sola vez -- por ejemplo, de lunes a viernes, y después el fin de semana aparte si es distinto."}
      </Text>

      {/* Selector de días */}
      <View style={styles.daysRow}>
        {DAY_ORDER.map((dia) => {
          const active = selectedDays.has(dia);
          return (
            <TouchableOpacity
              key={dia}
              style={[
                styles.dayChip,
                { borderColor: colors.border, backgroundColor: colors.inputBackground },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => toggleDay(dia)}
            >
              <Text style={[styles.dayChipText, { color: active ? "#FFFFFF" : colors.text }]}>
                {DAY_SHORT[dia]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Horario a aplicar a los días elegidos arriba. El switch "Cerrado"
          no aplica al registro (ver hideClosed). */}
      {!hideClosed && (
        <View style={styles.draftRow}>
          <Text style={[styles.draftLabel, { color: colors.text }]}>Cerrado</Text>
          <Switch
            value={draftClosed}
            onValueChange={setDraftClosed}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={draftClosed ? colors.primary : colors.card}
          />
        </View>
      )}

      {!applyAsClosed && (
        <View style={styles.timesRow}>
          <TextInput
            style={[
              styles.timeInput,
              { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground },
            ]}
            value={draftOpen}
            onChangeText={setDraftOpen}
            onBlur={handleBlurOpen}
            placeholder="09:00"
            placeholderTextColor={colors.placeholder}
          />
          <Text style={[styles.timeSeparator, { color: colors.placeholder }]}>—</Text>
          <TextInput
            style={[
              styles.timeInput,
              { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground },
            ]}
            value={draftClose}
            onChangeText={setDraftClose}
            onBlur={handleBlurClose}
            placeholder="22:00"
            placeholderTextColor={colors.placeholder}
          />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.applyButton,
          { backgroundColor: selectedDays.size > 0 ? colors.primary : colors.surfaceSecondary },
        ]}
        onPress={applyToSelectedDays}
        disabled={selectedDays.size === 0}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={16}
          color={selectedDays.size > 0 ? "#FFFFFF" : colors.textSecondary}
        />
        <Text
          style={[
            styles.applyButtonText,
            { color: selectedDays.size > 0 ? "#FFFFFF" : colors.textSecondary },
          ]}
        >
          {selectedDays.size > 0
            ? `Aplicar a ${selectedDays.size} día${selectedDays.size > 1 ? "s" : ""}`
            : "Elige al menos un día"}
        </Text>
      </TouchableOpacity>

      {/* Resumen: cómo queda el horario, agrupado -- tocar el lápiz
          precarga ese grupo arriba para editarlo de nuevo. En modo
          registro se listan solo los días CON atención (los que no se
          eligieron van en una línea aparte, no como filas "Cerrado"). */}
      <Text style={[styles.summaryTitle, { color: colors.text }]}>
        {hideClosed ? "Días de atención" : "Horario actual"}
      </Text>
      <View style={[styles.summaryCard, { borderColor: colors.divider }]}>
        {(hideClosed ? openGroups : groups).map((group) => (
          <View key={group.key} style={[styles.summaryRow, { borderBottomColor: colors.divider }]}>
            <View style={styles.summaryTextWrap}>
              <Text style={[styles.summaryDays, { color: colors.text }]}>
                {formatDayRange(group.days)}
              </Text>
              <Text style={[styles.summaryHours, { color: colors.textSecondary }]}>
                {group.cerrado ? "Cerrado" : `${group.hora_apertura ?? "--"} - ${group.hora_cierre ?? "--"}`}
              </Text>
            </View>
            <View style={styles.summaryActions}>
              <TouchableOpacity
                style={[styles.editGroupButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => loadGroupIntoDraft(group)}
                hitSlop={8}
              >
                <Ionicons name="pencil" size={14} color={colors.primary} />
              </TouchableOpacity>
              {/* En modo registro: quitar la atención de esos días (los
                  vuelve a "no atiende") sin necesidad de un switch. */}
              {hideClosed && !group.cerrado && (
                <TouchableOpacity
                  style={[styles.editGroupButton, { backgroundColor: colors.surfaceSecondary }]}
                  onPress={() => group.days.forEach((d) => onChange(d, { cerrado: true }))}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={15} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {hideClosed && openGroups.length === 0 && (
          <View style={[styles.summaryRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.summaryHours, { color: colors.textSecondary }]}>
              Todavía no configuraste ningún día de atención.
            </Text>
          </View>
        )}

        {hideClosed && closedDays.length > 0 && (
          <View style={[styles.summaryRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.summaryHours, { color: colors.textSecondary }]}>
              Sin atención: {closedDays.map((d) => DAY_LABELS[d]).join(", ")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 11.5,
    marginBottom: 12,
    lineHeight: 16,
  },
  daysRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  dayChip: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "800",
  },
  draftRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  draftLabel: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  timesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    textAlign: "center",
  },
  timeSeparator: {},
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
    marginBottom: 18,
  },
  applyButtonText: {
    fontSize: 13.5,
    fontWeight: "800",
  },
  summaryTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryDays: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  summaryHours: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editGroupButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
