import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

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

export function useKinePatients({ practiceId, query = '' }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!practiceId) {
        setRows([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, date_of_birth, avatar_url, created_at')
        .eq('practice_id', practiceId)
        .eq('role', 'child')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (qErr) {
        setRows([])
        setError(qErr)
        setLoading(false)
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

  const patients = useMemo(() => {
    const q = query.trim().toLowerCase()
    const normalized = rows.map((r) => {
      const firstname = r.firstname?.trim() ?? ''
      const lastname = r.lastname?.trim() ?? ''
      const name = [firstname, lastname].filter(Boolean).join(' ').trim() || 'Onbekend'
      const age = calcAge(r.date_of_birth)

      return {
        id: r.id,
        name,
        age: age ?? '—',
        avatarUrl: r.avatar_url || 'https://placehold.co/96x96?text=%20',
        focus: '—',
        lastSession: '—',
        progress: 0,
        delta: '',
      }
    })

    if (!q) return normalized
    return normalized.filter((p) => p.name.toLowerCase().includes(q))
  }, [rows, query])

  return { patients, loading, error, total: rows.length }
}

