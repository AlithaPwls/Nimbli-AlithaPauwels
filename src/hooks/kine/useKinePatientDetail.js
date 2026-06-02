import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { normalizeExerciseRow } from '@/lib/exerciseDisplay.js'
import { buildWeekBarsFromData, parseScheduleDays, startOfWeekMonday } from '@/lib/kind/weekCalendar.js'

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

function formatBirthdate(dateOfBirth) {
  if (!dateOfBirth) return null
  const d = new Date(dateOfBirth)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
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

function formatSessionTime(completedAt) {
  if (!completedAt) return '—'
  const d = new Date(completedAt)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAssignmentReps(reps, repUnit) {
  if (reps == null || !Number.isFinite(Number(reps))) return null
  const n = Number(reps)
  const unit = repUnit?.trim()
  return unit ? `${n} ${unit}` : `${n}`
}

function normalizeWeeklyCounts(counts) {
  const max = Math.max(0, ...counts)
  if (max === 0) return counts.map(() => 0)
  return counts.map((c) => Math.round((c / max) * 100))
}

function formatChartDayDateLabel(bar) {
  if (bar.key && /^\d{4}-\d{2}-\d{2}$/.test(bar.key)) {
    const [, month, day] = bar.key.split('-')
    return `${Number(day)}/${month}`
  }
  return String(bar.date ?? '—')
}

function formatChartDayTooltip(bar, isToday, status) {
  const suffix = isToday ? ' (vandaag)' : ''
  const weekday = (bar.labelShort ?? '—').toUpperCase()
  const head = `${weekday} ${formatChartDayDateLabel(bar)}${suffix}`
  if (status === 'future') {
    return `${head}: ${bar.total} oefeningen gepland`
  }
  return `${head}: ${bar.done}/${bar.total} oefeningen`
}

function buildKineWeeklyChart(weekStart, assignmentRows, weekSessionRows) {
  const bars = buildWeekBarsFromData(weekStart, assignmentRows, weekSessionRows)
  const todayKey = dateKeyLocal(new Date())
  const rawCounts = bars.map((b) => b.done)
  const dayStatuses = bars.map((b) => {
    if (!b.key || !todayKey) return 'past'
    if (b.key > todayKey) return 'future'
    return 'past'
  })
  const dayDetails = bars.map((bar, i) => {
    const status = dayStatuses[i]
    const isToday = bar.key === todayKey
    return {
      title: formatChartDayTooltip(bar, isToday, status),
      done: bar.done,
      total: bar.total,
    }
  })

  return {
    points: normalizeWeeklyCounts(rawCounts),
    days: bars.map((b) => b.labelShort),
    dayStatuses,
    dayDetails,
  }
}

const EMPTY_WEEKLY = {
  points: [0, 0, 0, 0, 0, 0, 0],
  days: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],
  dayStatuses: ['past', 'past', 'past', 'past', 'past', 'past', 'past'],
  dayDetails: Array.from({ length: 7 }, () => ({
    title: '—',
    done: 0,
    total: 0,
  })),
}

function mapChildProfile(row) {
  if (!row) return null
  const firstname = row.firstname?.trim() ?? ''
  const lastname = row.lastname?.trim() ?? ''
  const name = [firstname, lastname].filter(Boolean).join(' ').trim() || 'Onbekend'
  const age = calcAge(row.date_of_birth)

  return {
    id: row.id,
    firstname,
    lastname,
    name,
    age: age ?? null,
    ageLabel: age != null ? `${age} jaar` : '—',
    avatarUrl: row.avatar_url ?? null,
    birthdate: row.date_of_birth ?? null,
    birthdateLabel: formatBirthdate(row.date_of_birth),
    treatmentGoal: row.treatment_goal?.trim() || null,
    inviteCode: row.invite_code?.trim() || null,
    practiceId: row.practice_id ?? null,
    isRegistered: Boolean(row.user_id),
  }
}

function mapParentProfile(row) {
  if (!row) return null
  const firstname = row.firstname?.trim() ?? ''
  const lastname = row.lastname?.trim() ?? ''
  const name = [firstname, lastname].filter(Boolean).join(' ').trim() || '—'

  return {
    id: row.id,
    name,
    email: row.email?.trim() || null,
    phone: row.phone_number?.trim() || null,
    relation: row.role_parent?.trim() || null,
    isRegistered: Boolean(row.user_id),
  }
}

/**
 * Patient detail for kine dashboard: child profile, linked parent, weekly progress chart.
 */
export function useKinePatientDetail({ patientId, practiceId }) {
  const [childRow, setChildRow] = useState(null)
  const [parentRow, setParentRow] = useState(null)
  const [weeklyChart, setWeeklyChart] = useState(EMPTY_WEEKLY)
  const [sessions, setSessions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(Boolean(patientId))
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [tick, setTick] = useState(0)
  const silentRefetchRef = useRef(false)

  const refetch = useCallback((options = {}) => {
    silentRefetchRef.current = Boolean(options.silent)
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!patientId || !practiceId) {
        setChildRow(null)
        setParentRow(null)
        setWeeklyChart(EMPTY_WEEKLY)
        setSessions([])
        setAssignments([])
        setNotFound(!patientId)
        setError(null)
        setLoading(false)
        return
      }

      const silent = silentRefetchRef.current
      silentRefetchRef.current = false
      if (!silent) setLoading(true)
      setError(null)
      setNotFound(false)

      const { data: child, error: childErr } = await supabase
        .from('profiles')
        .select(
          'id, firstname, lastname, date_of_birth, avatar_url, treatment_goal, invite_code, practice_id, role, user_id'
        )
        .eq('id', patientId)
        .eq('role', 'child')
        .maybeSingle()

      if (cancelled) return

      if (childErr) {
        setChildRow(null)
        setParentRow(null)
        setWeeklyChart(EMPTY_WEEKLY)
        setSessions([])
        setAssignments([])
        setError(childErr)
        setNotFound(false)
        setLoading(false)
        return
      }

      if (!child?.id || child.practice_id !== practiceId) {
        setChildRow(null)
        setParentRow(null)
        setWeeklyChart(EMPTY_WEEKLY)
        setSessions([])
        setAssignments([])
        setNotFound(true)
        setLoading(false)
        return
      }

      setChildRow(child)

      const { data: rel, error: relErr } = await supabase
        .from('child_parent_relations')
        .select('parent_id, role_parent')
        .eq('child_id', child.id)
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (relErr) {
        setParentRow(null)
        setError(relErr)
      } else if (rel?.parent_id) {
        const { data: parent, error: parentErr } = await supabase
          .from('profiles')
          .select('id, firstname, lastname, email, user_id, phone_number')
          .eq('id', rel.parent_id)
          .eq('role', 'parent')
          .maybeSingle()

        if (cancelled) return

        if (parentErr) {
          setParentRow(null)
          setError(parentErr)
        } else {
          setParentRow(parent ? { ...parent, role_parent: rel?.role_parent ?? null } : null)
        }
      } else {
        setParentRow(null)
      }

      const weekStart = startOfWeekMonday(new Date())
      const weekEnd = addDaysLocal(weekStart, 7)

      const [
        { data: weekRows, error: weekErr },
        { data: assignRows, error: assignErr },
      ] = await Promise.all([
        supabase
          .from('exercise_sessions')
          .select('id, completed_at, success')
          .eq('child_id', child.id)
          .gte('completed_at', weekStart.toISOString())
          .lt('completed_at', weekEnd.toISOString()),
        supabase
          .from('exercise_assignments')
          .select('id, exercise_id, reps, rep_unit, created_at, schedule_days')
          .eq('child_id', child.id)
          .order('created_at', { ascending: false }),
      ])

      if (cancelled) return

      if (weekErr) {
        setWeeklyChart(EMPTY_WEEKLY)
        setError(weekErr)
        setLoading(false)
        return
      }

      if (!assignErr) {
        setWeeklyChart(buildKineWeeklyChart(weekStart, toArray(assignRows), toArray(weekRows)))
      } else {
        setWeeklyChart(buildKineWeeklyChart(weekStart, [], toArray(weekRows)))
      }

      const { data: sessionRows, error: sessionsErr } = await supabase
        .from('exercise_sessions')
        .select('id, exercise_id, completed_at, score, success')
        .eq('child_id', child.id)
        .order('completed_at', { ascending: false })
        .limit(50)

      if (cancelled) return

      if (sessionsErr) {
        setSessions([])
        setError(sessionsErr)
        setLoading(false)
        return
      }

      const events = toArray(sessionRows)
      const exerciseIds = Array.from(new Set(events.map((e) => e.exercise_id).filter(Boolean)))

      let exercisesById = new Map()
      if (exerciseIds.length > 0) {
        const { data: exRows, error: exErr } = await supabase
          .from('exercises')
          .select('id, title, name')
          .in('id', exerciseIds)

        if (cancelled) return

        if (exErr) {
          setSessions([])
          setError(exErr)
          setLoading(false)
          return
        }

        exercisesById = new Map(toArray(exRows).map((r) => [r.id, r]))
      }

      const sessionList = events.map((ev) => {
        const ex = exercisesById.get(ev.exercise_id) ?? null
        const title = ex?.title ?? ex?.name ?? 'Oefening'
        return {
          id: ev.id,
          title,
          time: formatSessionTime(ev.completed_at),
          score: typeof ev.score === 'number' ? ev.score : null,
          success: ev.success ?? null,
        }
      })

      setSessions(sessionList)

      if (cancelled) return

      if (assignErr) {
        setAssignments([])
        setError(assignErr)
        setLoading(false)
        return
      }

      const assignmentList = toArray(assignRows)
      const assignExerciseIds = Array.from(
        new Set(assignmentList.map((a) => a.exercise_id).filter(Boolean))
      )

      let assignExercisesById = new Map()
      if (assignExerciseIds.length > 0) {
        const { data: assignExRows, error: assignExErr } = await supabase
          .from('exercises')
          .select('*')
          .in('id', assignExerciseIds)

        if (cancelled) return

        if (assignExErr) {
          setAssignments([])
          setError(assignExErr)
          setLoading(false)
          return
        }

        assignExercisesById = new Map(
          toArray(assignExRows).map((r) => [r.id, normalizeExerciseRow(r)])
        )
      }

      const exercises = assignmentList
        .map((a) => {
          const base = assignExercisesById.get(a.exercise_id)
          if (!base) return null
          const repsOverride = formatAssignmentReps(a.reps, a.rep_unit)
          return {
            assignmentId: a.id,
            ...base,
            reps: repsOverride ?? base.reps,
            scheduleDays: parseScheduleDays(a),
          }
        })
        .filter(Boolean)

      setAssignments(exercises)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [patientId, practiceId, tick])

  const patient = useMemo(() => mapChildProfile(childRow), [childRow])
  const parent = useMemo(() => mapParentProfile(parentRow), [parentRow])

  return { patient, parent, weeklyChart, sessions, assignments, loading, error, notFound, refetch }
}
