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

/** Fixed layout slots on the kind progress path SVG (Figma positions). */
const PATH_LOWER_SLOTS = [
  { className: 'left-[24%] top-[6%] -translate-x-1/2' },
  { className: 'left-[57%] top-[20%] -translate-x-1/2' },
  { className: 'left-[24%] top-[34%] -translate-x-1/2' },
  { className: 'left-[57%] top-[49%] -translate-x-1/2' },
  { className: 'left-[24%] top-[67%] -translate-x-1/2' },
  { className: 'left-[57%] top-[82%] -translate-x-1/2' },
]

const PATH_UPPER_BEFORE_SLOTS = [
  { className: 'left-[24%] top-[4.5%] -translate-x-1/2' },
  { className: 'left-[57%] top-[19%] -translate-x-1/2' },
]

const PATH_UPPER_AFTER_SLOTS = [
  { className: 'left-[57%] top-[50%] -translate-x-1/2' },
  { className: 'left-[24%] top-[66%] -translate-x-1/2' },
  { className: 'left-[57%] top-[83%] -translate-x-1/2' },
]

function pathLabelFromDot(dot) {
  const short = dot?.label ?? ''
  return short.length >= 2 ? short.slice(0, 2).toUpperCase() : short.toUpperCase()
}

function pathVariantForDot(dot, { onLowerPath, futureIndex }) {
  if (dot.state === 'ok') return onLowerPath ? 'completed' : 'ok'
  if (dot.state === 'fail') return 'warn'
  if (dot.state === 'gift') return 'ok'
  if (dot.state === 'empty' || dot.state === 'today') {
    if (futureIndex === 0 || futureIndex === 1) return 'sleep'
    return 'locked'
  }
  return 'locked'
}

function attachSlots(dots, slots, options) {
  return dots.map((dot, i) => ({
    ...dot,
    label: pathLabelFromDot(dot),
    variant: pathVariantForDot(dot, options),
    className: slots[i]?.className ?? slots[slots.length - 1]?.className,
  }))
}

/**
 * Maps calendar-week dots onto the progress path (lower = earlier days, upper = around today).
 */
export function buildPathMarkersFromWeekDays(weekDays) {
  const days = toArray(weekDays)
  const todayIdx = days.findIndex((d) => d.isToday)
  if (todayIdx < 0) {
    return { lowerMarkers: [], upperBeforeToday: [], upperAfterToday: [] }
  }

  const beforeToday = days.slice(0, todayIdx)
  const afterToday = days.slice(todayIdx + 1)

  const upperBeforeDots = beforeToday.slice(-PATH_UPPER_BEFORE_SLOTS.length)
  const lowerDots = beforeToday.slice(0, Math.max(0, beforeToday.length - PATH_UPPER_BEFORE_SLOTS.length))
  const upperAfterDots = afterToday.slice(0, PATH_UPPER_AFTER_SLOTS.length)

  return {
    lowerMarkers: attachSlots(lowerDots, PATH_LOWER_SLOTS, { onLowerPath: true }),
    upperBeforeToday: attachSlots(upperBeforeDots, PATH_UPPER_BEFORE_SLOTS, { onLowerPath: false }),
    upperAfterToday: attachSlots(upperAfterDots, PATH_UPPER_AFTER_SLOTS, {
      onLowerPath: false,
      futureIndex: 0,
    }).map((m, i) => ({
      ...m,
      variant: pathVariantForDot(m, { onLowerPath: false, futureIndex: i }),
    })),
  }
}

export function kindPathMonthLabel(d = new Date()) {
  const label = new Date(d).toLocaleDateString('nl-BE', { month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
