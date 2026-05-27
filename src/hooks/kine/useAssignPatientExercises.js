import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

/**
 * Inserts exercise_assignments for a child (skips ids already assigned).
 */
export function useAssignPatientExercises() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  const assign = useCallback(async ({ childId, exerciseIds, assignments, assignedBy, reps, alreadyAssignedIds = [] }) => {
    if (!childId) {
      setError('Patiënt ontbreekt.')
      return { ok: false }
    }

    const assigned = new Set(
      Array.isArray(alreadyAssignedIds) ? alreadyAssignedIds.filter(Boolean) : []
    )
    const normalizedAssignments = Array.isArray(assignments)
      ? assignments
          .map((a) => ({
            exerciseId: a?.exerciseId ?? null,
            reps: a?.reps ?? null,
          }))
          .filter((a) => a.exerciseId && !assigned.has(a.exerciseId))
      : []

    const uniqueIds =
      normalizedAssignments.length > 0
        ? normalizedAssignments.map((a) => a.exerciseId)
        : Array.from(
            new Set((Array.isArray(exerciseIds) ? exerciseIds : []).filter((id) => id && !assigned.has(id)))
          )

    if (uniqueIds.length === 0) {
      setError('Selecteer minstens één nieuwe oefening.')
      return { ok: false }
    }

    setLoading(true)
    setError(null)

    const defaultRepsValue =
      reps == null || !Number.isFinite(Number(reps))
        ? null
        : Math.min(99, Math.max(1, Math.round(Number(reps))))

    const repsFor = (exerciseId) => {
      const match = normalizedAssignments.find((a) => a.exerciseId === exerciseId)
      if (!match) return defaultRepsValue
      const n = Number(match.reps)
      return Number.isFinite(n) ? Math.min(99, Math.max(1, Math.round(n))) : defaultRepsValue
    }

    const rows = uniqueIds.map((exerciseId) => ({
      child_id: childId,
      exercise_id: exerciseId,
      assigned_by: assignedBy ?? null,
      reps: repsFor(exerciseId),
    }))

    const { error: insertErr } = await supabase.from('exercise_assignments').insert(rows)

    setLoading(false)

    if (insertErr) {
      setError('Oefeningen toewijzen mislukt. Probeer opnieuw.')
      return { ok: false }
    }

    return { ok: true, count: uniqueIds.length }
  }, [])

  return { assign, loading, error, clearError }
}
