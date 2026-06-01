import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import {
  averageAdherencePct,
  currentWeekRange,
  practiceSuccessRatePct,
} from '@/lib/kine/practiceKpis.js'

function toArray(x) {
  return Array.isArray(x) ? x : []
}

export function useKineDashboardKpis({ practiceId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [kpis, setKpis] = useState({
    totalPatients: 0,
    adherencePct: null,
    successRatePct: null,
  })

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!practiceId) {
        setKpis({ totalPatients: 0, adherencePct: null, successRatePct: null })
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data: childRows, error: childErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('practice_id', practiceId)
        .eq('role', 'child')

      if (cancelled) return

      if (childErr) {
        setError(childErr)
        setLoading(false)
        return
      }

      const childIds = toArray(childRows).map((r) => r.id).filter(Boolean)
      const totalPatients = childIds.length

      if (childIds.length === 0) {
        setKpis({ totalPatients: 0, adherencePct: null, successRatePct: null })
        setLoading(false)
        return
      }

      const { weekStart, weekEnd } = currentWeekRange()

      const [assignRes, sessionRes] = await Promise.all([
        supabase
          .from('exercise_assignments')
          .select('id, child_id, exercise_id')
          .in('child_id', childIds),
        supabase
          .from('exercise_sessions')
          .select('child_id, assignment_id, exercise_id, completed_at, success')
          .in('child_id', childIds)
          .gte('completed_at', weekStart.toISOString())
          .lt('completed_at', weekEnd.toISOString()),
      ])

      if (cancelled) return

      if (assignRes.error || sessionRes.error) {
        setError(assignRes.error ?? sessionRes.error)
        setLoading(false)
        return
      }

      const assignments = toArray(assignRes.data)
      const sessions = toArray(sessionRes.data)

      setKpis({
        totalPatients,
        adherencePct: averageAdherencePct(childIds, assignments, sessions, weekStart, weekEnd),
        successRatePct: practiceSuccessRatePct(childIds, sessions, weekStart, weekEnd),
      })
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [practiceId])

  return { kpis, loading, error }
}
