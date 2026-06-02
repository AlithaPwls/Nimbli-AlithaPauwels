import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import supabase from '@/lib/supabaseClient.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'
import {
  buildKindDailyMissions,
  KIND_DAILY_MISSIONS_EMPTY,
} from '@/lib/kind/kindDailyMissions.js'
import { addDaysLocal, startOfDayLocal } from '@/lib/kind/weekCalendar.js'

function parseXpValue(value) {
  if (value == null || value === '') return 0
  const n = Number(typeof value === 'number' ? value : String(value).trim())
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
}

function sumXpFromSessions(rows) {
  let sum = 0
  for (const row of rows ?? []) {
    const ex = row?.exercises
    const xp = Array.isArray(ex) ? ex[0]?.xp_value : ex?.xp_value
    sum += parseXpValue(xp)
  }
  return sum
}

/**
 * Dagmissies uit succesvolle exercise_sessions van vandaag (lokale dag).
 */
export function useKindDailyMissions() {
  const { pathname } = useLocation()
  const { childId, loading: childLoading, error: childError } = useActiveChildId()
  const [exercisesCompletedToday, setExercisesCompletedToday] = useState(0)
  const [xpEarnedToday, setXpEarnedToday] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const dayBounds = useMemo(() => {
    const dayStart = startOfDayLocal(new Date())
    return { dayStart, dayEnd: addDaysLocal(dayStart, 1) }
  }, [pathname])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (childLoading) return

      if (childError || !childId) {
        setExercisesCompletedToday(0)
        setXpEarnedToday(0)
        setError(childError ?? null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('exercise_sessions')
        .select('id, exercises ( xp_value )')
        .eq('child_id', childId)
        .eq('success', true)
        .gte('completed_at', dayBounds.dayStart.toISOString())
        .lt('completed_at', dayBounds.dayEnd.toISOString())

      if (cancelled) return

      if (qErr) {
        setExercisesCompletedToday(0)
        setXpEarnedToday(0)
        setError(qErr)
        setLoading(false)
        return
      }

      const rows = data ?? []
      setExercisesCompletedToday(rows.length)
      setXpEarnedToday(sumXpFromSessions(rows))
      setError(null)
      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [childId, childLoading, childError, dayBounds.dayStart, dayBounds.dayEnd])

  const missions = useMemo(
    () =>
      buildKindDailyMissions({
        exercisesCompletedToday,
        xpEarnedToday,
      }),
    [exercisesCompletedToday, xpEarnedToday]
  )

  return {
    missions,
    loading: childLoading || loading,
    error,
    emptyMissions: KIND_DAILY_MISSIONS_EMPTY,
  }
}
