import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

function toArray(x) {
  return Array.isArray(x) ? x : []
}

function startOfDayLocal(d) {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

function addDaysLocal(d, days) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + days)
  return dt
}

function dateKeyLocal(d) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function dayLabelShort(d) {
  return new Date(d).toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '')
}

function formatRangeLabel(weekStart) {
  const start = new Date(weekStart)
  const end = addDaysLocal(start, 6)
  const month = end.toLocaleString('nl-BE', { month: 'long' })
  return `${start.getDate()}-${end.getDate()} ${month} ${end.getFullYear()}`
}

function xpFromSession(ev) {
  const score = typeof ev?.score === 'number' ? ev.score : null
  if (score != null) return Math.max(50, Math.min(250, Math.round(score)))
  return 150
}

function distributeAssignmentsOverWeek(assignments, weekKeys) {
  const result = new Map(weekKeys.map((k) => [k, []]))
  const list = toArray(assignments)
  for (const a of list) {
    const target = typeof a?.target_per_week === 'number' ? Math.max(1, Math.min(7, a.target_per_week)) : 1
    const slots = Array.from({ length: target }, (_, i) =>
      Math.round((i * (weekKeys.length - 1)) / Math.max(1, target - 1))
    )
    for (const idx of slots) {
      const key = weekKeys[idx] ?? weekKeys[0]
      result.get(key)?.push(a)
    }
  }
  return result
}

/**
 * Parent planning data for one child profile + a selected week.
 * Schema: profiles, exercise_assignments (child_id), exercise_sessions (child_id).
 */
export function useParentPlanningData(childProfileId, weekStart) {
  const [selectedDayKey, setSelectedDayKey] = useState(null)

  const [loading, setLoading] = useState(Boolean(childProfileId))
  const [error, setError] = useState(null)

  const [patient, setPatient] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [plannedByDay, setPlannedByDay] = useState({})
  const [recent, setRecent] = useState([])

  const weekStart0 = useMemo(() => startOfDayLocal(weekStart ?? new Date()), [weekStart])
  const weekEnd0 = useMemo(() => addDaysLocal(weekStart0, 7), [weekStart0])

  const days = useMemo(() => {
    const list = Array.from({ length: 7 }, (_, i) => addDaysLocal(weekStart0, i))
    return list.map((d) => {
      const key = dateKeyLocal(d)
      const dow = dayLabelShort(d).slice(0, 2).toUpperCase()
      const day = String(d.getDate()).padStart(2, '0')
      return { key, dow, day, date: d }
    })
  }, [weekStart0])

  const rangeLabel = useMemo(() => formatRangeLabel(weekStart0), [weekStart0])

  useEffect(() => {
    const first = days[0]?.key ?? null
    if (!selectedDayKey && first) setSelectedDayKey(first)
  }, [days, selectedDayKey])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!childProfileId) {
        setPatient(null)
        setUpcoming([])
        setPlannedByDay({})
        setRecent([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, date_of_birth, avatar_url, treatment_goal, created_at')
        .eq('id', childProfileId)
        .maybeSingle()

      if (cancelled) return
      if (profErr) {
        setPatient(null)
        setUpcoming([])
        setPlannedByDay({})
        setRecent([])
        if (profErr?.code === 'PGRST205') {
          setError(null)
          setLoading(false)
          return
        }
        setError(profErr)
        setLoading(false)
        return
      }

      if (!prof?.id) {
        setPatient(null)
        setUpcoming([])
        setPlannedByDay({})
        setRecent([])
        setLoading(false)
        return
      }

      setPatient({
        id: prof.id,
        firstname: prof.firstname,
        lastname: prof.lastname,
        birthdate: prof.date_of_birth,
        avatar_url: prof.avatar_url,
        focus: prof.treatment_goal,
        created_at: prof.created_at,
      })

      const { data: assigns, error: asErr } = await supabase
        .from('exercise_assignments')
        .select('id, child_id, exercise_id, reps, rep_unit, created_at')
        .eq('child_id', prof.id)
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (asErr) {
        setUpcoming([])
        setPlannedByDay({})
        setRecent([])
        setError(asErr)
        setLoading(false)
        return
      }

      const assignmentRows = toArray(assigns)
      const exerciseIds = Array.from(new Set(assignmentRows.map((r) => r?.exercise_id).filter(Boolean)))

      let exercisesById = new Map()
      if (exerciseIds.length > 0) {
        const { data: exRows, error: exErr } = await supabase
          .from('exercises')
          .select('id, title, media_url, focus, duration_seconds')
          .in('id', exerciseIds)

        if (cancelled) return
        if (exErr) {
          setUpcoming([])
          setPlannedByDay({})
          setRecent([])
          setError(exErr)
          setLoading(false)
          return
        }
        exercisesById = new Map(toArray(exRows).map((r) => [r.id, r]))
      }

      const upcomingList = assignmentRows
        .map((a) => {
          const ex = exercisesById.get(a.exercise_id) ?? null
          const title = ex?.title ?? 'Oefening'
          const goal = ex?.focus?.trim() || prof?.treatment_goal?.trim() || 'Oefening'
          const reps = typeof a?.reps === 'number' ? a.reps : null
          const unit = a?.rep_unit ? String(a.rep_unit) : null
          const meta = reps != null ? `• ${reps}${unit ? ` ${unit}` : ''}` : '• Start binnenkort'
          return { id: a.id, exerciseId: a.exercise_id, title, goal, meta }
        })
        .slice(0, 3)

      setUpcoming(upcomingList)

      const { data: weekEv, error: weekEvErr } = await supabase
        .from('exercise_sessions')
        .select('id, exercise_id, completed_at')
        .eq('child_id', prof.id)
        .gte('completed_at', weekStart0.toISOString())
        .lt('completed_at', weekEnd0.toISOString())

      if (cancelled) return
      if (weekEvErr) {
        setPlannedByDay({})
        setRecent([])
        setError(weekEvErr)
        setLoading(false)
        return
      }

      const doneByDayExercise = new Set()
      for (const ev of toArray(weekEv)) {
        const k = dateKeyLocal(ev.completed_at)
        if (!k || !ev.exercise_id) continue
        doneByDayExercise.add(`${k}:${ev.exercise_id}`)
      }

      const weekKeys = days.map((d) => d.key).filter(Boolean)
      const distributed = distributeAssignmentsOverWeek(assignmentRows, weekKeys)
      const nextPlanned = {}

      for (const dayKey of weekKeys) {
        const list = distributed.get(dayKey) ?? []
        nextPlanned[dayKey] = list.map((a) => {
          const ex = exercisesById.get(a.exercise_id) ?? null
          const title = ex?.title ?? 'Oefening'
          const imageUrl = ex?.media_url || null
          const reps = typeof a?.reps === 'number' ? a.reps : 10
          const minutes =
            typeof ex?.duration_seconds === 'number'
              ? Math.max(1, Math.round(ex.duration_seconds / 60))
              : 2
          const done = doneByDayExercise.has(`${dayKey}:${a.exercise_id}`)
          return { id: a.id, exerciseId: a.exercise_id, title, imageUrl, reps, minutes, done }
        })
      }

      setPlannedByDay(nextPlanned)

      const { data: recentEv, error: recentEvErr } = await supabase
        .from('exercise_sessions')
        .select('id, exercise_id, completed_at, score')
        .eq('child_id', prof.id)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (cancelled) return
      if (recentEvErr) {
        setRecent([])
        setError(recentEvErr)
        setLoading(false)
        return
      }

      const recentEvents = toArray(recentEv)
      const recentIds = Array.from(new Set(recentEvents.map((e) => e.exercise_id).filter(Boolean)))

      if (recentIds.some((id) => !exercisesById.has(id))) {
        const missing = recentIds.filter((id) => !exercisesById.has(id))
        if (missing.length > 0) {
          const { data: moreEx, error: moreErr } = await supabase
            .from('exercises')
            .select('id, title')
            .in('id', missing)

          if (cancelled) return
          if (moreErr) {
            setRecent([])
            setError(moreErr)
            setLoading(false)
            return
          }
          exercisesById = new Map([...exercisesById.entries(), ...toArray(moreEx).map((r) => [r.id, r])])
        }
      }

      setRecent(
        recentEvents.map((ev) => {
          const ex = exercisesById.get(ev.exercise_id) ?? null
          return {
            id: ev.id,
            title: ex?.title ?? 'Oefening',
            time: ev?.completed_at ? new Date(ev.completed_at).toLocaleString('nl-BE') : '',
            xp: xpFromSession(ev),
          }
        })
      )

      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [childProfileId, weekStart0, weekEnd0, days])

  return {
    loading,
    error,
    rangeLabel,
    days,
    selectedDayKey,
    setSelectedDayKey,
    upcoming,
    plannedByDay,
    recent,
    patient,
    weekStart: weekStart0,
  }
}
