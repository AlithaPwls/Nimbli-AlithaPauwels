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

function dayLabelShort(d) {
  return new Date(d).toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '')
}

function normalizeWeeklyCounts(counts) {
  const max = Math.max(0, ...counts)
  if (max === 0) return counts.map(() => 0)
  return counts.map((c) => Math.round((c / max) * 100))
}

const EMPTY_WEEKLY = {
  points: [0, 0, 0, 0, 0, 0, 0],
  days: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],
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
    avatarUrl: row.avatar_url || 'https://placehold.co/96x96?text=%20',
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
    phone: null,
    relation: null,
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
  const [loading, setLoading] = useState(Boolean(patientId))
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!patientId || !practiceId) {
        setChildRow(null)
        setParentRow(null)
        setWeeklyChart(EMPTY_WEEKLY)
        setNotFound(!patientId)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
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
        setError(childErr)
        setNotFound(false)
        setLoading(false)
        return
      }

      if (!child?.id || child.practice_id !== practiceId) {
        setChildRow(null)
        setParentRow(null)
        setWeeklyChart(EMPTY_WEEKLY)
        setNotFound(true)
        setLoading(false)
        return
      }

      setChildRow(child)

      const { data: rel, error: relErr } = await supabase
        .from('child_parent_relations')
        .select('parent_id')
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
          .select('id, firstname, lastname, email, user_id')
          .eq('id', rel.parent_id)
          .eq('role', 'parent')
          .maybeSingle()

        if (cancelled) return

        if (parentErr) {
          setParentRow(null)
          setError(parentErr)
        } else {
          setParentRow(parent ?? null)
        }
      } else {
        setParentRow(null)
      }

      const today0 = startOfDayLocal(new Date())
      const windowStart = addDaysLocal(today0, -6)

      const { data: weekRows, error: weekErr } = await supabase
        .from('exercise_sessions')
        .select('id, completed_at')
        .eq('child_id', child.id)
        .gte('completed_at', windowStart.toISOString())
        .lt('completed_at', addDaysLocal(today0, 1).toISOString())

      if (cancelled) return

      if (weekErr) {
        setWeeklyChart(EMPTY_WEEKLY)
        setError(weekErr)
        setLoading(false)
        return
      }

      const countsByDay = new Map()
      for (const ev of toArray(weekRows)) {
        const k = dateKeyLocal(ev.completed_at)
        if (!k) continue
        const dt = new Date(ev.completed_at)
        if (dt >= windowStart && dt < addDaysLocal(today0, 1)) {
          countsByDay.set(k, (countsByDay.get(k) ?? 0) + 1)
        }
      }

      const days = Array.from({ length: 7 }, (_, i) => addDaysLocal(windowStart, i))
      const rawCounts = days.map((d) => countsByDay.get(dateKeyLocal(d)) ?? 0)
      const dayLabels = days.map((d) => {
        const label = dayLabelShort(d)
        return label.charAt(0).toUpperCase() + label.slice(1, 2)
      })

      setWeeklyChart({
        points: normalizeWeeklyCounts(rawCounts),
        days: dayLabels,
      })
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [patientId, practiceId])

  const patient = useMemo(() => mapChildProfile(childRow), [childRow])
  const parent = useMemo(() => mapParentProfile(parentRow), [parentRow])

  return { patient, parent, weeklyChart, loading, error, notFound }
}
