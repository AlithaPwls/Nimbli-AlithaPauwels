import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import supabase from '@/lib/supabaseClient.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'
import {
  addDaysLocal,
  buildWeekBarsFromData,
  buildWeekDayDotsFromBars,
  formatKindWeekRange,
  startOfWeekMonday,
} from '@/lib/kind/weekCalendar.js'

function emptyBars() {
  return buildWeekBarsFromData(startOfWeekMonday(new Date()), [], [])
}

/**
 * Calendar week (Mon–Sun): planned exercises vs completed sessions per day.
 */
export function useKindOverviewWeekChart() {
  const { pathname } = useLocation()
  const { childId, loading: childLoading, error: childError } = useActiveChildId()
  const weekStart = useMemo(() => startOfWeekMonday(new Date()), [pathname])
  const [bars, setBars] = useState(emptyBars)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const weekDays = useMemo(() => buildWeekDayDotsFromBars(bars), [bars])
  const weekRangeLabel = useMemo(() => formatKindWeekRange(weekStart), [weekStart])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (childLoading) return

      if (childError || !childId) {
        setBars(emptyBars())
        setLoading(false)
        setError(childError ?? null)
        return
      }

      setLoading(true)
      setError(null)

      const weekEnd = addDaysLocal(weekStart, 7)

      const [assignRes, sessionRes] = await Promise.all([
        supabase
          .from('exercise_assignments')
          .select('id, exercise_id, created_at, schedule_days')
          .eq('child_id', childId),
        supabase
          .from('exercise_sessions')
          .select('id, exercise_id, completed_at, success')
          .eq('child_id', childId)
          .gte('completed_at', weekStart.toISOString())
          .lt('completed_at', weekEnd.toISOString()),
      ])

      if (cancelled) return

      if (assignRes.error || sessionRes.error) {
        setBars(emptyBars())
        setError(assignRes.error ?? sessionRes.error)
        setLoading(false)
        return
      }

      setBars(buildWeekBarsFromData(weekStart, assignRes.data ?? [], sessionRes.data ?? []))
      setError(null)
      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [childId, childLoading, childError, pathname, weekStart])

  return {
    bars,
    weekDays,
    weekRangeLabel,
    weekStart,
    loading: loading || childLoading,
    error,
  }
}
