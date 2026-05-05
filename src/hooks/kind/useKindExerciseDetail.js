import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { exerciseDescriptionForDialog, normalizeExerciseRow } from '@/lib/exerciseDisplay.js'

function formatRepsLine(assignment, exerciseRow) {
  const n = assignment?.reps
  if (typeof n === 'number' && Number.isFinite(n)) {
    const u = (assignment?.rep_unit || '').trim()
    if (u) return `${n} ${u}`
    return `${n} herhalingen`
  }
  const norm = normalizeExerciseRow(exerciseRow)
  if (typeof norm.reps === 'number' && Number.isFinite(norm.reps)) {
    return `${norm.reps} herhalingen`
  }
  if (typeof norm.reps === 'string' && norm.reps.trim() && norm.reps !== '—') {
    return norm.reps.trim()
  }
  return '—'
}

/**
 * Loads one assigned exercise for the kind flow (RLS: parent/child may only read exercises linked via exercise_assignments).
 */
export function useKindExerciseDetail(exerciseId, assignmentId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(exerciseId))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!exerciseId) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      const { data: ex, error: exErr } = await supabase
        .from('exercises')
        .select(
          'id, title, name, description, duration_seconds, difficulty, focus, media_url, thumbnail_url, reps, xp_value'
        )
        .eq('id', exerciseId)
        .maybeSingle()

      if (cancelled) return

      if (exErr) {
        setData(null)
        setError(exErr)
        setLoading(false)
        return
      }

      if (!ex) {
        setData(null)
        setError(new Error('Oefening niet gevonden.'))
        setLoading(false)
        return
      }

      let assignment = null
      if (assignmentId) {
        const { data: a } = await supabase
          .from('exercise_assignments')
          .select('id, reps, rep_unit')
          .eq('id', assignmentId)
          .maybeSingle()
        assignment = a
      }

      const norm = normalizeExerciseRow(ex)
      const repsLine = formatRepsLine(assignment, ex)
      const xpRaw = ex.xp_value
      const xpParsed =
        xpRaw == null || xpRaw === ''
          ? null
          : Number(typeof xpRaw === 'number' ? xpRaw : String(xpRaw).trim())
      const xpValue = xpParsed != null && Number.isFinite(xpParsed) ? Math.round(xpParsed) : null

      const descriptionDisplay = exerciseDescriptionForDialog(ex.description ?? '')

      setData({
        id: ex.id,
        title: norm.title,
        category: norm.category,
        difficulty: norm.difficulty,
        repsLine,
        repsTarget:
          typeof assignment?.reps === 'number' && Number.isFinite(assignment.reps)
            ? Math.round(assignment.reps)
            : typeof ex.reps === 'number' && Number.isFinite(ex.reps)
              ? Math.round(ex.reps)
              : null,
        imageUrl: norm.imageUrl,
        descriptionDisplay,
        mediaUrl: typeof ex.media_url === 'string' && ex.media_url.trim() ? ex.media_url.trim() : null,
        thumbnailUrl:
          typeof ex.thumbnail_url === 'string' && ex.thumbnail_url.trim()
            ? ex.thumbnail_url.trim()
            : null,
        xpValue,
        durationSeconds:
          typeof ex.duration_seconds === 'number' && Number.isFinite(ex.duration_seconds)
            ? ex.duration_seconds
            : null,
      })
      setError(null)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [exerciseId, assignmentId])

  return { data, loading, error }
}
