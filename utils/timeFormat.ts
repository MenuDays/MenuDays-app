// Normaliza lo que el usuario haya tecleado en un campo de hora
// ("8", "8am", "830", "0800", "8:30pm"...) al formato "HH:mm" (24hs,
// con ceros a la izquierda) que espera el backend. Pensado para usarse
// en onBlur -- mientras tipea se deja el texto libre tal cual, y recién
// al salir del campo se corrige, así no pelea con lo que el usuario
// está escribiendo.
//
// Devuelve null si no se pudo interpretar nada razonable (el campo
// queda como el usuario lo dejó, sin forzar un valor inventado).
export function normalizeTimeInput(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const isPm = /pm\b/.test(trimmed);
  const isAm = /am\b/.test(trimmed);
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (!digits) return null;

  let hour: number;
  let minute: number;

  if (digits.length <= 2) {
    // "8" / "20" -> solo hora, minutos en :00
    hour = Number(digits);
    minute = 0;
  } else if (digits.length === 3) {
    // "830" -> 8:30
    hour = Number(digits.slice(0, 1));
    minute = Number(digits.slice(1));
  } else {
    // "0800" / "1430" (y cualquier extra se ignora) -> HH:mm
    hour = Number(digits.slice(0, 2));
    minute = Number(digits.slice(2, 4));
  }

  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;

  if (isNaN(hour) || isNaN(minute)) return null;
  hour = Math.min(23, Math.max(0, hour));
  minute = Math.min(59, Math.max(0, minute));

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
