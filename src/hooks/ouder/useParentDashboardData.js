import { useEffect, useMemo, useState } from 'react'
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

function addDaysLocal(d, days) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + days)
  return dt
}

function dayLabelShort(d) {
  return new Date(d).toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '')
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
  const [weekly, setWeekly] = useState({ points: [0, 0, 0, 0, 0, 0, 0], days: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], deltaPercent: 0 })
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
        setWeekly({ points: [0, 0, 0, 0, 0, 0, 0], days: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], deltaPercent: 0 })
        setProgress({ balans: 0, mobiliteit: 0, kracht: 0 })
        setError(profErr)
        setLoading(false)
        return
      }

      setChild(prof ?? null)

      if (!prof?.id) {
        setUpcoming([])
        setRecent([])
        setWeekly({ points: [0, 0, 0, 0, 0, 0, 0], days: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], deltaPercent: 0 })
        setProgress({ balans: 0, mobiliteit: 0, kracht: 0 })
        setLoading(false)
        return
      }

      // 2) assignments
      const { data: assigns, error: asErr } = await supabase
        .from('exercise_assignments')
        .select('id, child_id, exercise_id, reps, rep_unit, created_at')
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
          .select('id, title, description, media_url, is_archived')
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
          const title = ex?.title ?? ex?.name ?? 'Oefening'
          const goal = ex?.focus?.trim() || prof?.treatment_goal?.trim() || 'Oefening'
          const reps = typeof a?.reps === 'number' ? a.reps : null
          const unit = a?.rep_unit ? String(a.rep_unit) : null
          const meta = reps ? `• ${reps}${unit ? ` ${unit}` : ''}` : '• Start binnenkort'
          return {
            id: a.id,
            exerciseId: a.exercise_id,
            title,
            goal,
            meta,
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
        .limit(8)

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

      // Weekly frequency: last 7 days (including today) vs previous 7 days.
      const today0 = startOfDayLocal(new Date())
      const windowStart = addDaysLocal(today0, -6)
      const prevStart = addDaysLocal(today0, -13)
      const prevEnd = addDaysLocal(today0, -7)

      const { data: weekRows, error: weekErr } = await supabase
        .from('exercise_sessions')
        .select('id, completed_at, exercise_id')
        .eq('child_id', prof.id)
        .gte('completed_at', prevStart.toISOString())
        .lt('completed_at', addDaysLocal(today0, 1).toISOString())

      if (cancelled) return
      if (weekErr) {
        setWeekly({ points: [0, 0, 0, 0, 0, 0, 0], days: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], deltaPercent: 0 })
        setProgress({ balans: 0, mobiliteit: 0, kracht: 0 })
        setError(weekErr)
        setLoading(false)
        return
      }

      const weekEvents = toArray(weekRows)
      const countsByDay = new Map()
      let currentTotal = 0
      let prevTotal = 0
      for (const ev of weekEvents) {
        const k = dateKeyLocal(ev.completed_at)
        if (!k) continue
        const dt = new Date(ev.completed_at)
        if (dt >= windowStart && dt < addDaysLocal(today0, 1)) {
          countsByDay.set(k, (countsByDay.get(k) ?? 0) + 1)
          currentTotal += 1
        } else if (dt >= prevStart && dt < prevEnd) {
          prevTotal += 1
        }
      }

      const days = Array.from({ length: 7 }, (_, i) => addDaysLocal(windowStart, i))
      const points = days.map((d) => countsByDay.get(dateKeyLocal(d)) ?? 0)
      const dayLabels = days.map(dayLabelShort).map((s) => s.slice(0, 2).toUpperCase())
      const deltaPercent =
        prevTotal <= 0 ? (currentTotal > 0 ? 100 : 0) : Math.round(((currentTotal - prevTotal) / prevTotal) * 100)

      setWeekly({ points, days: dayLabels, deltaPercent })

      let b = 0
      let m = 0
      let k = 0
      for (const ev of weekEvents) {
        const dt = new Date(ev.completed_at)
        if (!(dt >= windowStart && dt < addDaysLocal(today0, 1))) continue
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

