import { addDaysLocal, startOfWeekMonday } from '@/lib/kind/weekCalendar.js'

export function currentWeekRange() {
  const weekStart = startOfWeekMonday(new Date())
  const weekEnd = addDaysLocal(weekStart, 7)
  return { weekStart, weekEnd }
}

/** Share of assigned exercises completed successfully this calendar week (0–1). */
export function computeWeekProgress(childId, assignments, sessions, weekStart, weekEnd) {
  const childAssignments = assignments.filter((a) => a.child_id === childId)
  const total = childAssignments.length
  if (total === 0) return null

  const assignmentIds = new Set(childAssignments.map((a) => a.id))
  const exerciseToAssignment = new Map(childAssignments.map((a) => [a.exercise_id, a.id]))
  const completed = new Set()

  for (const s of sessions) {
    if (s.child_id !== childId || s.success !== true) continue
    const dt = new Date(s.completed_at)
    if (Number.isNaN(dt.getTime()) || dt < weekStart || dt >= weekEnd) continue

    if (s.assignment_id && assignmentIds.has(s.assignment_id)) {
      completed.add(s.assignment_id)
    } else if (s.exercise_id && exerciseToAssignment.has(s.exercise_id)) {
      completed.add(exerciseToAssignment.get(s.exercise_id))
    }
  }

  return completed.size / total
}

function roundPct(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return null
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100)
}

/** Mean therapietrouw over children with at least one assignment this week. */
export function averageAdherencePct(childIds, assignments, sessions, weekStart, weekEnd) {
  const progresses = childIds
    .map((id) => computeWeekProgress(id, assignments, sessions, weekStart, weekEnd))
    .filter((p) => p != null)

  if (progresses.length === 0) return null
  return roundPct(progresses.reduce((sum, p) => sum + p, 0) / progresses.length)
}

/** Share of exercise sessions marked successful this calendar week (0–100). */
export function practiceSuccessRatePct(childIds, sessions, weekStart, weekEnd) {
  const childSet = new Set(childIds)
  let total = 0
  let successes = 0

  for (const s of sessions) {
    if (!childSet.has(s.child_id)) continue
    const dt = new Date(s.completed_at)
    if (Number.isNaN(dt.getTime()) || dt < weekStart || dt >= weekEnd) continue
    total += 1
    if (s.success === true) successes += 1
  }

  if (total === 0) return null
  return roundPct(successes / total)
}
