import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FormDateFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChangeText: (value: string) => void;
}

const ORANGE = "#F5A800";
const DARK = "#1A1A1A";
const TEXT = "#3E2723";
const MUTED = "#9E9E9E";
const LIGHT = "#F7F7F7";

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function stringToDate(value: string): Date {
  if (!value) return new Date();

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function displayDate(value: string): string {
  if (!value) return "Seleccionar fecha";

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();

  // Convertimos Domingo=0 a Domingo=6 para que la semana empiece en Lunes
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previousMonthDays = new Date(year, month, 0).getDate();

  const days: {
    day: number;
    currentMonth: boolean;
    date: Date;
  }[] = [];

  // Días del mes anterior
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = previousMonthDays - i;

    days.push({
      day,
      currentMonth: false,
      date: new Date(year, month - 1, day),
    });
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      currentMonth: true,
      date: new Date(year, month, day),
    });
  }

  // Días del mes siguiente
  let nextDay = 1;

  while (days.length < 42) {
    days.push({
      day: nextDay,
      currentMonth: false,
      date: new Date(year, month + 1, nextDay),
    });

    nextDay++;
  }

  return days;
}

export default function FormDateField({
  label,
  value,
  onChangeText,
}: FormDateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const initialDate = useMemo(() => stringToDate(value), [value]);

  const [visibleMonth, setVisibleMonth] = useState(initialDate.getMonth());
  const [visibleYear, setVisibleYear] = useState(initialDate.getFullYear());

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? stringToDate(value) : null
  );

  const calendarDays = getCalendarDays(visibleYear, visibleMonth);

  function openCalendar() {
    const date = value ? stringToDate(value) : new Date();

    setSelectedDate(value ? date : null);
    setVisibleMonth(date.getMonth());
    setVisibleYear(date.getFullYear());
    setShowPicker(true);
  }

  function previousMonth() {
    if (visibleMonth === 0) {
      setVisibleMonth(11);
      setVisibleYear((year) => year - 1);
    } else {
      setVisibleMonth((month) => month - 1);
    }
  }

  function nextMonth() {
    if (visibleMonth === 11) {
      setVisibleMonth(0);
      setVisibleYear((year) => year + 1);
    } else {
      setVisibleMonth((month) => month + 1);
    }
  }

  function selectDate(date: Date) {
    setSelectedDate(date);
  }

  function confirmDate() {
    if (selectedDate) {
      onChangeText(dateToString(selectedDate));
    }

    setShowPicker(false);
  }

  function isSelected(date: Date) {
    if (!selectedDate) return false;

    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  }

  function isToday(date: Date) {
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      {/* Campo */}
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={openCalendar}
        activeOpacity={0.75}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-outline" size={20} color={ORANGE} />
        </View>

        <Text style={[styles.text, !value && styles.placeholder]}>
          {displayDate(value)}
        </Text>

        <Ionicons
          name="chevron-down"
          size={18}
          color={MUTED}
        />
      </TouchableOpacity>

      {/* Calendario */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <View>
                <Text style={styles.headerSmall}>SELECCIONAR FECHA</Text>

                <Text style={styles.headerDate}>
                  {selectedDate
                    ? displayDate(dateToString(selectedDate))
                    : "Elegí una fecha"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPicker(false)}
              >
                <Ionicons name="close" size={20} color={TEXT} />
              </TouchableOpacity>
            </View>

            {/* Separador */}
            <View style={styles.divider} />

            {/* Mes */}
            <View style={styles.monthHeader}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={previousMonth}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={TEXT}
                />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {MONTHS[visibleMonth]} {visibleYear}
              </Text>

              <TouchableOpacity
                style={styles.monthButton}
                onPress={nextMonth}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={TEXT}
                />
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((day) => (
                <View style={styles.weekDay} key={day}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Días */}
            <View style={styles.daysGrid}>
              {calendarDays.map((item, index) => {
                const selected = isSelected(item.date);
                const today = isToday(item.date);

                return (
                  <TouchableOpacity
                    key={`${item.date.toISOString()}-${index}`}
                    style={[
                      styles.dayCell,
                      selected && styles.selectedDay,
                      !item.currentMonth && styles.otherMonthDay,
                    ]}
                    onPress={() => selectDate(item.date)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !item.currentMonth &&
                          styles.otherMonthDayText,
                        today &&
                          !selected &&
                          styles.todayText,
                        selected && styles.selectedDayText,
                      ]}
                    >
                      {item.day}
                    </Text>

                    {today && !selected && (
                      <View style={styles.todayDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Acciones */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDate}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.confirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 16,
  },

  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5DF",
    marginRight: 10,
  },

  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: TEXT,
  },

  placeholder: {
    color: MUTED,
    fontWeight: "400",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  calendarContainer: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,

    // Sombra Android
    elevation: 12,

    // Sombra iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },

  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerSmall: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: ORANGE,
    marginBottom: 4,
  },

  headerDate: {
    fontSize: 25,
    fontWeight: "800",
    color: DARK,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 18,
  },

  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  monthTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },

  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },

  weekDay: {
    width: "14.285%",
    alignItems: "center",
    justifyContent: "center",
  },

  weekDayText: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCell: {
    width: "14.285%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginBottom: 2,
  },

  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },

  selectedDay: {
    backgroundColor: ORANGE,
  },

  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  otherMonthDay: {
    opacity: 0.35,
  },

  otherMonthDayText: {
    color: MUTED,
  },

  todayText: {
    color: ORANGE,
    fontWeight: "800",
  },

  todayDot: {
    position: "absolute",
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ORANGE,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666666",
  },

  confirmButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 16,
    backgroundColor: ORANGE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  confirmText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});