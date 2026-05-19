import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

/**
 * Inserts exercise_assignments for a child (skips ids already assigned).
 */
export function useAssignPatientExercises() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  const assign = useCallback(async ({ childId, exerciseIds, assignedBy, alreadyAssignedIds = [] }) => {
    if (!childId) {
      setError('Patiënt ontbreekt.')
      return { ok: false }
    }

    const assigned = new Set(
      Array.isArray(alreadyAssignedIds) ? alreadyAssignedIds.filter(Boolean) : []
    )
    const unique = Array.from(
      new Set((Array.isArray(exerciseIds) ? exerciseIds : []).filter((id) => id && !assigned.has(id)))
    )

    if (unique.length === 0) {
      setError('Selecteer minstens één nieuwe oefening.')
      return { ok: false }
    }

    setLoading(true)
    setError(null)

    const rows = unique.map((exerciseId) => ({
      child_id: childId,
      exercise_id: exerciseId,
      assigned_by: assignedBy ?? null,
    }))

    const { error: insertErr } = await supabase.from('exercise_assignments').insert(rows)

    setLoading(false)

    if (insertErr) {
      setError('Oefeningen toewijzen mislukt. Probeer opnieuw.')
      return { ok: false }
    }

    return { ok: true, count: unique.length }
  }, [])

  return { assign, loading, error, clearError }
}
