import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { normalizeExerciseRow } from '@/lib/exerciseDisplay.js'

function rowHasColumn(rows, key) {
  const sample = rows.find((r) => r && typeof r === 'object')
  return sample != null && Object.prototype.hasOwnProperty.call(sample, key)
}

function exerciseSortKey(row) {
  const t = row?.title ?? row?.name ?? ''
  return String(t).toLowerCase()
}

/**
 * Loads exercises for the kine UI. Some databases omit `practice_id` or `is_archived`;
 * we never filter on missing columns in SQL (PostgREST would error). Scoped in JS when
 * those keys exist on returned rows.
 */
export function usePracticeExercises(practiceId) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      // No .order() in SQL: column may be `name` instead of `title` or missing on some schemas.
      const { data, error: qErr } = await supabase.from('exercises').select('*')

      if (cancelled) return

      if (qErr) {
        setRows([])
        setError(qErr)
        setLoading(false)
        return
      }

      let list = Array.isArray(data) ? data : []

      if (rowHasColumn(list, 'practice_id')) {
        if (!practiceId) {
          list = []
        } else {
          list = list.filter((r) => r.practice_id === practiceId)
        }
      }

      if (rowHasColumn(list, 'is_archived')) {
        list = list.filter((r) => !r.is_archived)
      }

      list = [...list].sort((a, b) => exerciseSortKey(a).localeCompare(exerciseSortKey(b), 'nl'))

      setRows(list)
      setError(null)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [practiceId])

  const exercises = useMemo(() => rows.map((r) => normalizeExerciseRow(r)), [rows])

  return { exercises, loading, error }
}
