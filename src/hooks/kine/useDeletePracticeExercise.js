import { useCallback, useState } from 'react'
import { deletePracticeExercise } from '@/lib/kine/deletePracticeExercise.js'

export function useDeletePracticeExercise() {
  const [deletingExerciseId, setDeletingExerciseId] = useState(null)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  const deleteExercise = useCallback(async ({ exerciseId, practiceId, rawRow }) => {
    setError(null)

    if (!exerciseId || !practiceId) {
      setError('Oefening niet gevonden.')
      return { ok: false }
    }

    setDeletingExerciseId(exerciseId)

    try {
      const result = await deletePracticeExercise({ exerciseId, practiceId, rawRow })
      if (!result.ok) {
        setError(result.message || 'Verwijderen mislukt.')
        return { ok: false }
      }
      return { ok: true }
    } finally {
      setDeletingExerciseId(null)
    }
  }, [])

  return { deleteExercise, deletingExerciseId, error, clearError }
}
