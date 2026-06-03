import { normalizeScheduleDays } from '@/lib/kine/exerciseScheduleDays.js'

function toArray(x) {
  return Array.isArray(x) ? x : []
}

/** Monday = 0 … Sunday = 6. */
export function weekdayIndexMondayZero(d) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return (dt.getDay() + 6) % 7
}

export function parseScheduleDays(row) {
  const raw = row?.schedule_days ?? row?.scheduleDays
  return normalizeScheduleDays(raw)
}

export function isAssignmentScheduledOnDate(assignment, date) {
  const idx = weekdayIndexMondayZero(date)
  if (idx == null) return false
  return parseScheduleDays(assignment).includes(idx)
}

/** When no exercises are planned for a day, Figma uses a daily target of 5. */
export const KIND_DAILY_EXERCISE_TARGET = 5

export function startOfDayLocal(d) {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

export function startOfWeekMonday(d) {
  const dt = startOfDayLocal(d)
  const mondayOffset = (dt.getDay() + 6) % 7
  dt.setDate(dt.getDate() - mondayOffset)
  return dt
}

export function addDaysLocal(d, days) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + days)
  return dt
}

export function dateKeyLocal(d) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

/** Weekday label for chart (M, D, W, …). */
export function kindWeekDayLabel(d) {
  return new Date(d)
    .toLocaleDateString('nl-BE', { weekday: 'short' })
    .replace('.', '')
    .charAt(0)
    .toUpperCase()
}

/** Two-letter weekday label (Ma, Di, Wo, …) for compact week rows. */
export function kindWeekDayLabelShort(d) {
  const raw = new Date(d).toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '')
  const two = raw.slice(0, 2)
  return two.charAt(0).toUpperCase() + two.slice(1)
}

/** Full weekday label for path markers (ZONDAG, WOENSDAG, …). */
export function kindWeekDayLabelFull(d) {
  return new Date(d).toLocaleDateString('nl-BE', { weekday: 'long' }).toUpperCase()
}

/** e.g. "20–26 mei 2026" for the current calendar week. */
export function formatKindWeekRange(weekStart) {
  const start = startOfDayLocal(weekStart)
  const end = addDaysLocal(start, 6)
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const monthYear = end.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${monthYear}`
  }
  const startPart = start.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
  const endPart = end.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startPart} – ${endPart}`
}

/** Map date keys (YYYY-MM-DD) to assignments scheduled on that weekday. */
export function distributeAssignmentsByScheduleDays(assignments, weekDays) {
  const days = toArray(weekDays)
  const result = new Map()
  for (let i = 0; i < days.length; i += 1) {
    const key = dateKeyLocal(days[i])
    if (key) result.set(key, [])
  }

  for (const a of toArray(assignments)) {
    const scheduled = parseScheduleDays(a)
    for (let i = 0; i < days.length; i += 1) {
      if (!scheduled.includes(i)) continue
      const key = dateKeyLocal(days[i])
      if (key) result.get(key)?.push(a)
    }
  }

  return result
}

/** @deprecated Use distributeAssignmentsByScheduleDays */
export function distributeAssignmentsOverWeek(assignments, weekKeys) {
  const weekDays = weekKeys.map((key, i) => {
    const parts = String(key).split('-').map(Number)
    if (parts.length !== 3) return addDaysLocal(startOfWeekMonday(new Date()), i)
    return new Date(parts[0], parts[1] - 1, parts[2])
  })
  return distributeAssignmentsByScheduleDays(assignments, weekDays)
}

/**
 * Per calendar day (Mon–Sun): sessions from `completed_at`, target from planned assignments or daily goal.
 */
export function buildWeekBarsFromData(weekStart, assignmentRows, sessionRows) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysLocal(weekStart, i))
  const distributed = distributeAssignmentsByScheduleDays(assignmentRows, weekDays)

  const sessionsByDay = new Map()
  for (const ev of toArray(sessionRows)) {
    if (ev?.success !== true) continue
    const k = dateKeyLocal(ev.completed_at)
    if (!k) continue
    sessionsByDay.set(k, (sessionsByDay.get(k) ?? 0) + 1)
  }

  return weekDays.map((d) => {
    const key = dateKeyLocal(d)
    const planned = key ? (distributed.get(key) ?? []) : []
    const plannedTotal = planned.length
    const done = key ? (sessionsByDay.get(key) ?? 0) : 0
    const total = plannedTotal > 0 ? plannedTotal : KIND_DAILY_EXERCISE_TARGET

    return {
      key,
      label: kindWeekDayLabel(d),
      labelShort: kindWeekDayLabelShort(d),
      date: d.getDate(),
      done,
      total,
      plannedTotal,
    }
  })
}

/**
 * Dot states for the compact week row (dashboard sidebar).
 * Uses assignment distribution + successful sessions (same as buildWeekBarsFromData).
 */
export function buildWeekDayDotsFromBars(bars) {
  const todayKey = dateKeyLocal(new Date())
  const allGoalsMet = toArray(bars).length > 0 && bars.every((b) => b.done >= b.total)

  return toArray(bars).map((bar, index) => {
    const metGoal = bar.done >= bar.total
    const isToday = bar.key === todayKey
    const isFuture = Boolean(bar.key && todayKey && bar.key > todayKey)
    const isPast = Boolean(bar.key && todayKey && bar.key < todayKey)
    const isLastDay = index === bars.length - 1

    let state = 'empty'
    if (isFuture) {
      state = 'empty'
    } else if (isToday) {
      state = metGoal ? 'ok' : 'today'
    } else if (isPast) {
      state = metGoal ? 'ok' : 'fail'
    }

    if (isLastDay && allGoalsMet && metGoal) {
      state = 'gift'
    }

    return {
      key: bar.key,
      label: bar.labelShort ?? bar.label,
      date: bar.date,
      state,
      done: bar.done,
      total: bar.total,
      isToday,
    }
  })
}

function pathLabelFromDot(dot) {
  const short = dot?.label ?? ''
  return short.length >= 2 ? short.slice(0, 2).toUpperCase() : short.toUpperCase()
}

function pathFullLabelFromDot(dot) {
  const key = dot?.key
  if (!key) return pathLabelFromDot(dot)
  const parts = String(key).split('-').map(Number)
  if (parts.length !== 3) return pathLabelFromDot(dot)
  const [year, month, day] = parts
  return kindWeekDayLabelFull(new Date(year, month - 1, day))
}

function pathVariantForDot(dot, { futureIndex }) {
  if (dot.state === 'ok' || dot.state === 'gift') return 'ok'
  if (dot.state === 'fail') return 'warn'
  if (dot.state === 'empty' || dot.state === 'today') {
    if (futureIndex === 0 || futureIndex === 1) return 'sleep'
    return 'locked'
  }
  return 'locked'
}

/**
 * Zigzag day slots — identical on upper, main, and lower path segments (Figma 490:2699).
 * Index 0–1: top curve · 2–5: rest of segment.
 */
const PATH_DAY_ZIGZAG_SLOTS = [
  
  { className: 'left-[31%] top-[7%] -translate-x-1/2' },
  { className: 'left-[74%] top-[18%] -translate-x-1/2' },
  { className: 'left-[28%] top-[35%] -translate-x-1/2' },
  { className: 'left-[73%] top-[51%] -translate-x-1/2' },
  { className: 'left-[25%] top-[66%] -translate-x-1/2' },
  { className: 'left-[74%] top-[84%] -translate-x-1/2' },
]

/** Bovenste pad — eigen offsets (slot 0 los van middenpad). */
const PATH_UPPER_DAY_SLOTS = [
  { className: 'left-[74%] top-[32%] -translate-x-1/2' },
  ...PATH_DAY_ZIGZAG_SLOTS.slice(1),
]

const PATH_SLOT_TOP_PCT = [4, 15, 33, 50, 66, 84]

/** Onderste pad: zigzag links/rechts, hoogte tussen vroegere offset 0 en 1. */
const PATH_LOWER_DAY_SLOTS = [
  { className: 'left-[25%] top-[18%] -translate-x-1/2' },
  { className: 'left-[74%] top-[50%] -translate-x-1/2' },
  { className: 'left-[28%] top-[38%] -translate-x-1/2' },
  { className: 'left-[73%] top-[52%] -translate-x-1/2' },
  { className: 'left-[25%] top-[66%] -translate-x-1/2' },
  { className: 'left-[64%] top-[80%] -translate-x-1/2' },
]

const PATH_LOWER_TOP_PCT = [12, 24, 38, 52, 66, 80]

function lowerPathSlot(index) {
  return PATH_LOWER_DAY_SLOTS[Math.min(index, PATH_LOWER_DAY_SLOTS.length - 1)]
}

function upperPathSlot(index) {
  return PATH_UPPER_DAY_SLOTS[Math.min(index, PATH_UPPER_DAY_SLOTS.length - 1)]
}

const PATH_MAIN_BEFORE_SLOT = PATH_DAY_ZIGZAG_SLOTS[0]
export const PATH_MAIN_TODAY_SLOT = PATH_DAY_ZIGZAG_SLOTS[1]
/** Komende dagen op het middenpad t/m vrijdag (za/zo op onderste segment). */
const PATH_MAIN_AFTER_MAX = 4
const PATH_MAIN_AFTER_SLOTS = PATH_DAY_ZIGZAG_SLOTS.slice(2, 2 + PATH_MAIN_AFTER_MAX)
export const PATH_MAIN_MONTH_SLOT = { className: 'left-[62%] top-[77%] -translate-x-1/2' }

/** Clip height for stacked path segments (hide unused tail). */
export function getPathSegmentClipPercent(markerCount, startSlotIndex = 0) {
  if (markerCount <= 0) return 0
  const endIdx = Math.min(startSlotIndex + markerCount - 1, PATH_SLOT_TOP_PCT.length - 1)
  return Math.min(100, PATH_SLOT_TOP_PCT[endIdx] + 16)
}

export function getLowerPathClipPercent(markerCount) {
  if (markerCount <= 0) return 0
  return Math.min(100, PATH_LOWER_TOP_PCT[markerCount - 1] + 16)
}

function toPathMarker(dot, slot, { futureIndex, labelMode = 'short' }) {
  return {
    ...dot,
    label: labelMode === 'full' ? pathFullLabelFromDot(dot) : pathLabelFromDot(dot),
    variant: pathVariantForDot(dot, { futureIndex }),
    className: slot.className,
    labelMode,
  }
}

/**
 * Maps the calendar week onto the three stacked path segments (Figma Oefeningen Dashboard).
 */
export function buildPathMarkersFromWeekDays(weekDays) {
  const days = toArray(weekDays)
  const todayKey = dateKeyLocal(new Date())
  let todayIdx = days.findIndex((d) => d.isToday)
  if (todayIdx < 0 && todayKey) {
    todayIdx = days.findIndex((d) => d.key === todayKey)
  }
  if (todayIdx < 0) {
    return { upperPath: [], mainBeforeToday: null, mainAfterToday: [], lowerPath: [] }
  }

  const beforeToday = days.slice(0, todayIdx)
  const afterToday = days.slice(todayIdx + 1)

  const upperDots =
    beforeToday.length > 1
      ? beforeToday.slice(0, -1).slice(-PATH_UPPER_DAY_SLOTS.length)
      : []
  const mainBeforeDot = beforeToday.length > 0 ? beforeToday[beforeToday.length - 1] : null
  const mainAfterDots = afterToday.slice(0, PATH_MAIN_AFTER_MAX)
  const lowerDots = afterToday.slice(
    PATH_MAIN_AFTER_MAX,
    PATH_MAIN_AFTER_MAX + PATH_DAY_ZIGZAG_SLOTS.length
  )

  return {
    upperPath: upperDots.map((dot, i) => toPathMarker(dot, upperPathSlot(i), { futureIndex: i })),
    mainBeforeToday: mainBeforeDot
      ? toPathMarker(mainBeforeDot, PATH_MAIN_BEFORE_SLOT, { futureIndex: 0, labelMode: 'full' })
      : null,
    mainAfterToday: mainAfterDots.map((dot, i) =>
      toPathMarker(dot, PATH_MAIN_AFTER_SLOTS[i], { futureIndex: i, labelMode: 'full' })
    ),
    lowerPath: lowerDots.map((dot, i) =>
      toPathMarker(dot, lowerPathSlot(i), {
        futureIndex: PATH_MAIN_AFTER_MAX + i,
        labelMode: 'full',
      })
    ),
  }
}

export function kindPathMonthLabel(d = new Date()) {
  const label = new Date(d).toLocaleDateString('nl-BE', { month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
