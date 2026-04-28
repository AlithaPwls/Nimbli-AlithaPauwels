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

/**
 * Parent dashboard helper: loads the linked child profile row (same invite_code).
 */
export function useChildForParent(parentProfile) {
  const inviteCode = parentProfile?.invite_code ?? null

  const [child, setChild] = useState(null)
  const [loading, setLoading] = useState(Boolean(inviteCode))
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!inviteCode) {
        setChild(null)
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, date_of_birth, created_at, avatar_url, treatment_goal')
        .eq('invite_code', inviteCode)
        .eq('role', 'child')
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (qErr) {
        setChild(null)
        setError(qErr)
        setLoading(false)
        return
      }

      setChild(data ?? null)
      setError(null)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [inviteCode])

  const derived = useMemo(() => {
    const firstname = child?.firstname?.trim() || '—'
    const lastname = child?.lastname?.trim() || ''
    const age = calcAge(child?.date_of_birth)
    const fullName = `${firstname}${lastname ? ` ${lastname}` : ''}`.trim()
    const memberSince = formatMemberSince(child?.created_at)
    const goal = child?.treatment_goal?.trim() || null
    return { fullName, age, memberSince, goal }
  }, [child])

  return { child, derived, loading, error }
}

