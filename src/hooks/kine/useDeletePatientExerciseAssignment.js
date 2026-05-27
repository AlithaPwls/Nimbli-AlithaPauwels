import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

export function useDeletePatientExerciseAssignment() {
  const [deletingAssignmentId, setDeletingAssignmentId] = useState(null)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  const deleteAssignment = useCallback(async ({ assignmentId, childId }) => {
    setError(null)

    if (!assignmentId) {
      setError('Oefening ontbreekt.')
      return { ok: false }
    }

    setDeletingAssignmentId(assignmentId)

    let query = supabase.from('exercise_assignments').delete().eq('id', assignmentId)
    if (childId) query = query.eq('child_id', childId)

    try {
      const { error: deleteErr } = await query

      if (deleteErr) {
        setError('Oefening verwijderen mislukt. Probeer opnieuw.')
        return { ok: false }
      }

      return { ok: true }
    } finally {
      setDeletingAssignmentId(null)
    }
  }, [])

  return { deleteAssignment, deletingAssignmentId, error, clearError }
}
