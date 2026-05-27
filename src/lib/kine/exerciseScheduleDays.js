/** Monday = 0 … Sunday = 6 (matches calendar week in weekCalendar.js). */

export const EXERCISE_SCHEDULE_DAYS = [
  { index: 0, short: 'Ma', label: 'Elke maandag' },
  { index: 1, short: 'Di', label: 'Elke dinsdag' },
  { index: 2, short: 'Wo', label: 'Elke woensdag' },
  { index: 3, short: 'Do', label: 'Elke donderdag' },
  { index: 4, short: 'Vr', label: 'Elke vrijdag' },
  { index: 5, short: 'Za', label: 'Elke zaterdag' },
  { index: 6, short: 'Zo', label: 'Elke zondag' },
]

/** Default: maandag t/m zaterdag (zondag rustdag). */
export function defaultExerciseScheduleDays() {
  return [0, 1, 2, 3, 4, 5]
}

export function normalizeScheduleDays(raw) {
  if (!Array.isArray(raw)) return defaultExerciseScheduleDays()
  const valid = raw
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  const unique = [...new Set(valid)].sort((a, b) => a - b)
  return unique.length > 0 ? unique : defaultExerciseScheduleDays()
}

export function toggleScheduleDay(days, dayIndex) {
  const normalized = normalizeScheduleDays(days)
  if (normalized.includes(dayIndex)) {
    const next = normalized.filter((d) => d !== dayIndex)
    return next.length > 0 ? next : normalized
  }
  return [...normalized, dayIndex].sort((a, b) => a - b)
}

export function scheduleDaysSummary(days) {
  const normalized = normalizeScheduleDays(days)
  if (normalized.length === 7) return 'Elke dag'
  const labels = EXERCISE_SCHEDULE_DAYS.filter((d) => normalized.includes(d.index)).map(
    (d) => d.short
  )
  return labels.join(', ')
}
