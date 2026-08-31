import type { RestaurantSchedule } from "../services/restaurant.service";

// ==========================================================================
// Normalización de horarios del restaurante.
//
// CAUSA RAÍZ del bug de "el domingo no se puede editar/guardar":
// ScheduleEditor toma el array `restaurante_horarios` que llega del back y,
// al aplicar un cambio, busca la fila del día por su `dia_semana`
// (`dayByDiaSemana.get(dia)`). Si esa fila NO existe -- porque el back
// devolvió solo los días configurados, o devolvió el domingo como `0`
// (convención JS `getDay()`) en vez de `7` (convención de la app y del
// ScheduleDto del back) -- el `.get(7)` da `undefined` y ESE día se
// saltea en silencio. El domingo es el que más cae en ese hueco.
//
// Esta función deja SIEMPRE un array canónico de 7 filas (`dia_semana`
// 1..7, Lunes..Domingo), rellenando los días faltantes como "cerrado" y
// mapeando un eventual `0` a `7`. Con eso, los 7 días -- domingo incluido
// -- pasan por exactamente el mismo camino: no hay parche para el domingo,
// se corrige la representación de datos para todos por igual.
// ==========================================================================

// Convención de la app y del backend: 1 = Lunes ... 7 = Domingo.
export const WEEKDAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Lleva cualquier valor de día (0..7, o basura) a 1..7. `0` -> `7` (domingo). */
export function canonicalWeekday(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return 7; // domingo en convención JS getDay()
  if (n >= 1 && n <= 7) return Math.trunc(n);
  return null;
}

/**
 * Devuelve exactamente 7 filas (Lunes..Domingo), ordenadas por día.
 * - Acepta un array parcial, desordenado, o con el domingo como 0.
 * - Los días que no venían se agregan como `cerrado: true`.
 * - Conserva el `id` real de las filas que sí venían (para que el guardado
 *   por-id siga funcionando); a las rellenadas les pone un id negativo
 *   sintético (nunca colisiona con un id real y no se manda al back, que
 *   solo usa `diaSemana`).
 */
export function normalizeSchedule(
  raw: RestaurantSchedule[] | null | undefined
): RestaurantSchedule[] {
  const byDay = new Map<number, RestaurantSchedule>();

  for (const entry of raw ?? []) {
    const day = canonicalWeekday(entry?.dia_semana);
    if (day == null) continue;
    // Si por algún motivo llegan dos filas para el mismo día, gana la
    // primera con horario cargado; si no, la primera a secas.
    const existing = byDay.get(day);
    if (!existing || (existing.cerrado && !entry.cerrado)) {
      byDay.set(day, { ...entry, dia_semana: day });
    }
  }

  return WEEKDAY_NUMBERS.map((day) => {
    const found = byDay.get(day);
    if (found) return found;
    return {
      id: -day, // sintético: no colisiona con ids reales (>0), no se envía
      dia_semana: day,
      hora_apertura: null,
      hora_cierre: null,
      cerrado: true,
    };
  });
}
