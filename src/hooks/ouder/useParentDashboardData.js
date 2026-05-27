import { useEffect, useMemo, useState } from 'react'
import { EXERCISE_THUMBNAIL_SELECT, normalizeExerciseRow } from '@/lib/exerciseDisplay.js'
import supabase from '@/lib/supabaseClient.js'

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const d = new Date(dateOfBirth)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age >= 0 ? age : null
}

function formatMemberSince(dateValue) {
  if (!dateValue) return null
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return null
  const month = d.toLocaleString('nl-BE', { month: 'long' })
  return `Lid sinds ${month} ${d.getFullYear()}`
}

function toArray(x) {
  return Array.isArray(x) ? x : []
}

function dateKeyLocal(d) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return null
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function startOfDayLocal(d) {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

/** Monday 00:00 local — matches oefenplanning week strip. */
function startOfWeekMonday(d) {
  const dt = startOfDayLocal(d)
  const mondayOffset = (dt.getDay() + 6) % 7
  dt.setDate(dt.getDate() - mondayOffset)
  return dt
}

function addDaysLocal(d, days) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + days)
  return dt
}

function dayLabelShort(d) {
  return new Date(d).toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '')
}

/** Calendar week columns: Monday → Sunday. */
const WEEK_DAY_LABELS = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO']

function formatWeekRangeLabel(weekStart) {
  const start = new Date(weekStart)
  const end = addDaysLocal(start, 6)
  const month = end.toLocaleString('nl-BE', { month: 'long' })
  const monthLabel = `${month.charAt(0).toUpperCase()}${month.slice(1)} ${end.getFullYear()}`
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return { rangeLabel: `${start.getDate()}–${end.getDate()} ${monthLabel}`, monthLabel }
  }
  const startMonth = start.toLocaleString('nl-BE', { month: 'short' })
  const endMonth = end.toLocaleString('nl-BE', { month: 'long' })
  const endMonthCap = `${endMonth.charAt(0).toUpperCase()}${endMonth.slice(1)}`
  return {
    rangeLabel: `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonthCap} ${end.getFullYear()}`,
    monthLabel: `${endMonthCap} ${end.getFullYear()}`,
  }
}

function emptyWeeklyState(weekStart = startOfWeekMonday(new Date())) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysLocal(weekStart, i))
  const { rangeLabel, monthLabel } = formatWeekRangeLabel(weekStart)
  return {
    points: [0, 0, 0, 0, 0, 0, 0],
    days: WEEK_DAY_LABELS,
    dayDates: weekDays.map((d) => d.getDate()),
    rangeLabel,
    monthLabel,
    deltaPercent: 0,
  }
}

function xpFromEvent(ev) {
  const score = typeof ev?.score === 'number' ? ev.score : null
  if (score != null) return Math.max(50, Math.min(250, Math.round(score)))
  return 150
}

/**
 * Parent dashboard data for one child profile.
 * Frontend expects this to stay stable even if some tables are empty.
 */
export function useParentDashboardData(childProfileId) {
  const [loading, setLoading] = useState(Boolean(childProfileId))
  const [error, setError] = useState(null)

  const [child, setChild] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [recent, setRecent] = useState([])
  const [weekly, setWeekly] = useState(() => emptyWeeklyState())
  const [progress, setProgress] = useState({ balans: 0, mobiliteit: 0, kracht: 0 })

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!childProfileId) {
        setChild(null)
        setUpcoming([])
        setRecent([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      // 1) child profile header
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, date_of_birth, avatar_url, treatment_goal, created_at')
        .eq('id', childProfileId)
        .maybeSingle()

      if (cancelled) return

      if (profErr) {
        setChild(null)
        setUpcoming([])
        setRecent([])
        setWeekly(emptyWeeklyState())
        setProgress({ balans: 0, mobiliteit: 0, kracht: 0 })
        setError(profErr)
        setLoading(false)
        return
      }

      setChild(prof ?? null)

      if (!prof?.id) {
        setUpcoming([])
        setRecent([])
        setWeekly(emptyWeeklyState())
        setProgress({ balans: 0, mobiliteit: 0, kracht: 0 })
        setLoading(false)
        return
      }

      // 2) assignments
      const { data: assigns, error: asErr } = await supabase
        .from('exercise_assignments')
        .select('id, child_id, exercise_id, reps, rep_unit, created_at, schedule_days')
        .eq('child_id', prof.id)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (asErr) {
        setUpcoming([])
        setRecent([])
        setError(asErr)
        setLoading(false)
        return
      }

      const assignmentRows = toArray(assigns)
      const exerciseIds = Array.from(
        new Set(assignmentRows.map((r) => r?.exercise_id).filter(Boolean))
      )

      // 3) exercise details for upcoming
      let exercisesById = new Map()
      if (exerciseIds.length > 0) {
        const { data: exRows, error: exErr } = await supabase
          .from('exercises')
          .select(`${EXERCISE_THUMBNAIL_SELECT}, is_archived`)
          .in('id', exerciseIds)

        if (cancelled) return
        if (exErr) {
          setUpcoming([])
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
          const norm = ex ? normalizeExerciseRow(ex) : null
          const reps = typeof a?.reps === 'number' ? a.reps : null
          const minutes =
            ex?.duration_seconds != null && Number.isFinite(Number(ex.duration_seconds))
              ? Math.max(1, Math.ceil(Number(ex.duration_seconds) / 60))
              : null
          return {
            id: a.id,
            exerciseId: a.exercise_id,
            title: norm?.title ?? 'Oefening',
            focus: norm?.category ?? 'Oefening',
            categoryTone: norm?.categoryTone ?? 'default',
            reps,
            minutes,
            imageUrl: norm?.imageUrl,
          }
        })
        .slice(0, 3)

      setUpcoming(upcomingList)

      // 4) recent sessions
      const { data: evRows, error: evErr } = await supabase
        .from('exercise_sessions')
        .select('id, exercise_id, completed_at, score, success')
        .eq('child_id', prof.id)
        .order('completed_at', { ascending: false })
        .limit(5)

      if (cancelled) return

      if (evErr) {
        setRecent([])
        setError(evErr)
        setLoading(false)
        return
      }

      const events = toArray(evRows)
      const recentExerciseIds = Array.from(new Set(events.map((e) => e.exercise_id).filter(Boolean)))

      let recentExercisesById = exercisesById
      if (recentExerciseIds.some((id) => !recentExercisesById.has(id))) {
        const missing = recentExerciseIds.filter((id) => !recentExercisesById.has(id))
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
          recentExercisesById = new Map([
            ...recentExercisesById.entries(),
            ...toArray(moreEx).map((r) => [r.id, r]),
          ])
        }
      }

      const recentList = events.map((ev) => {
        const ex = recentExercisesById.get(ev.exercise_id) ?? null
        const title = ex?.title ?? ex?.name ?? 'Oefening'
        const time = ev?.completed_at ? new Date(ev.completed_at).toLocaleString('nl-BE') : ''
        return {
          id: ev.id,
          title,
          time,
          xp: xpFromEvent(ev),
        }
      })

      setRecent(recentList)

      // Weekly frequency: current calendar week (Mon–Sun) vs previous week.
      const today0 = startOfDayLocal(new Date())
      const weekStart = startOfWeekMonday(today0)
      const weekEnd = addDaysLocal(weekStart, 7)
      const prevWeekStart = addDaysLocal(weekStart, -7)

      const { data: weekRows, error: weekErr } = await supabase
        .from('exercise_sessions')
        .select('id, completed_at, exercise_id')
        .eq('child_id', prof.id)
        .gte('completed_at', prevWeekStart.toISOString())
        .lt('completed_at', weekEnd.toISOString())

      if (cancelled) return
      if (weekErr) {
        setWeekly(emptyWeeklyState())
        setProgress({ balans: 0, mobiliteit: 0, kracht: 0 })
        setError(weekErr)
        setLoading(false)
        return
      }

      const weekEvents = toArray(weekRows)
      const weekDays = Array.from({ length: 7 }, (_, i) => addDaysLocal(weekStart, i))
      const currentWeekKeys = new Set(weekDays.map((d) => dateKeyLocal(d)))
      const prevWeekDays = Array.from({ length: 7 }, (_, i) => addDaysLocal(prevWeekStart, i))
      const prevWeekKeys = new Set(prevWeekDays.map((d) => dateKeyLocal(d)))

      const countsByDay = new Map()
      let currentTotal = 0
      let prevTotal = 0
      for (const ev of weekEvents) {
        const k = dateKeyLocal(ev.completed_at)
        if (!k) continue
        if (currentWeekKeys.has(k)) {
          countsByDay.set(k, (countsByDay.get(k) ?? 0) + 1)
          currentTotal += 1
        } else if (prevWeekKeys.has(k)) {
          prevTotal += 1
        }
      }

      const points = weekDays.map((d) => countsByDay.get(dateKeyLocal(d)) ?? 0)
      const dayDates = weekDays.map((d) => d.getDate())
      const deltaPercent =
        prevTotal <= 0 ? (currentTotal > 0 ? 100 : 0) : Math.round(((currentTotal - prevTotal) / prevTotal) * 100)

      const { rangeLabel, monthLabel } = formatWeekRangeLabel(weekStart)
      setWeekly({ points, days: WEEK_DAY_LABELS, dayDates, rangeLabel, monthLabel, deltaPercent })

      let b = 0
      let m = 0
      let k = 0
      for (const ev of weekEvents) {
        const dayKey = dateKeyLocal(ev.completed_at)
        if (!dayKey || !currentWeekKeys.has(dayKey)) continue
        const focus = String(recentExercisesById.get(ev.exercise_id)?.focus ?? '').toLowerCase()
        if (focus.includes('balans') || focus.includes('evenwicht')) b += 1
        else if (focus.includes('mobil') || focus.includes('stretch') || focus.includes('rekken')) m += 1
        else if (focus.includes('kracht')) k += 1
      }
      const sum = b + m + k
      if (sum > 0) {
        setProgress({
          balans: Math.round((b / sum) * 100),
          mobiliteit: Math.round((m / sum) * 100),
          kracht: Math.round((k / sum) * 100),
        })
      } else {
        setProgress({ balans: 0, mobiliteit: 0, kracht: 0 })
      }

      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [childProfileId])

  const header = useMemo(() => {
    const firstname = child?.firstname?.trim() || '—'
    const lastname = child?.lastname?.trim() || ''
    const fullName = `${firstname}${lastname ? ` ${lastname}` : ''}`.trim()
    const age = calcAge(child?.date_of_birth)
    const memberSince = formatMemberSince(child?.created_at)
    const goal = child?.treatment_goal?.trim() || null
    const avatarUrl = child?.avatar_url ? String(child.avatar_url).trim() : null
    return {
      fullName,
      age,
      avatarUrl: avatarUrl || null,
      memberSince,
      goal,
    }
  }, [child])

  return { header, child, upcoming, recent, weekly, progress, loading, error }
}

