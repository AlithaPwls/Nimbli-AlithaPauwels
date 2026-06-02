import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { currentWeekRange, computeWeekProgress } from '@/lib/kine/practiceKpis.js'

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age < 0 ? null : age
}

function toArray(x) {
  return Array.isArray(x) ? x : []
}

function formatLastSession(completedAt) {
  if (!completedAt) return '—'
  const d = new Date(completedAt)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('nl-BE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildPatientExtras(childIds, assignments, sessions) {
  const { weekStart, weekEnd } = currentWeekRange()
  const extras = {}

  for (const childId of childIds) {
    const childSessions = sessions.filter((s) => s.child_id === childId)
    const last = childSessions[0]
    extras[childId] = {
      lastSession: formatLastSession(last?.completed_at),
      progress: computeWeekProgress(childId, assignments, sessions, weekStart, weekEnd) ?? 0,
    }
  }

  return extras
}

/** @typedef {'asc' | 'desc'} PatientNameSort */

export function useKinePatients({ practiceId, query = '', nameSort = 'asc' }) {
  const [rows, setRows] = useState([])
  const [extras, setExtras] = useState({})
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!practiceId) {
        setRows([])
        setExtras({})
        setLoading(false)
        setDetailsLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, date_of_birth, avatar_url, treatment_goal, created_at')
        .eq('practice_id', practiceId)
        .eq('role', 'child')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (qErr) {
        setRows([])
        setExtras({})
        setError(qErr)
        setLoading(false)
        setDetailsLoading(false)
        return
      }

      setRows(Array.isArray(data) ? data : [])
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [practiceId])

  useEffect(() => {
    let cancelled = false
    const childIds = rows.map((r) => r.id).filter(Boolean)

    if (childIds.length === 0) {
      setExtras({})
      setDetailsLoading(false)
      return
    }

    async function run() {
      setDetailsLoading(true)

      const [assignRes, sessionRes] = await Promise.all([
        supabase
          .from('exercise_assignments')
          .select('id, child_id, exercise_id, schedule_days')
          .in('child_id', childIds),
        supabase
          .from('exercise_sessions')
          .select('child_id, assignment_id, exercise_id, completed_at, success')
          .in('child_id', childIds)
          .order('completed_at', { ascending: false }),
      ])

      if (cancelled) return

      if (assignRes.error || sessionRes.error) {
        setExtras({})
        setDetailsLoading(false)
        return
      }

      setExtras(
        buildPatientExtras(childIds, toArray(assignRes.data), toArray(sessionRes.data))
      )
      setDetailsLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [rows])

  const patients = useMemo(() => {
    const q = query.trim().toLowerCase()
    const normalized = rows.map((r) => {
      const firstname = r.firstname?.trim() ?? ''
      const lastname = r.lastname?.trim() ?? ''
      const name = [firstname, lastname].filter(Boolean).join(' ').trim() || 'Onbekend'
      const age = calcAge(r.date_of_birth)
      const meta = extras[r.id] ?? { lastSession: '—', progress: 0 }

      return {
        id: r.id,
        name,
        age: age ?? '—',
        avatarUrl: r.avatar_url,
        focus: r.treatment_goal?.trim() || '—',
        lastSession: meta.lastSession,
        progress: meta.progress,
        delta: '',
      }
    })

    const filtered = !q ? normalized : normalized.filter((p) => p.name.toLowerCase().includes(q))

    return [...filtered].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'nl-BE', { sensitivity: 'base' })
      return nameSort === 'desc' ? -cmp : cmp
    })
  }, [rows, query, extras, nameSort])

  return {
    patients,
    loading: loading || detailsLoading,
    error,
    total: rows.length,
  }
}
