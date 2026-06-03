import { useCallback, useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

function toArray(x) {
  return Array.isArray(x) ? x : []
}

function mapKineRow(row) {
  const firstname = row?.firstname?.trim() ?? ''
  const lastname = row?.lastname?.trim() ?? ''
  const name = [firstname, lastname].filter(Boolean).join(' ').trim() || 'Onbekend'
  return {
    id: row.id,
    firstname,
    lastname,
    name,
    email: row?.email?.trim() || null,
    phone: row?.phone_number?.trim() || null,
    address: row?.address?.trim() || null,
    avatarUrl: row?.avatar_url?.trim() || null,
    dateOfBirth: row?.date_of_birth ?? null,
    createdAt: row?.created_at ?? null,
  }
}

/**
 * Kinesiologists (role `kine`) linked to the same practice.
 */
export function usePracticeKines({ practiceId, currentProfileId = null }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

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
        .select('id, firstname, lastname, email, phone_number, address, avatar_url, date_of_birth, created_at')
        .eq('practice_id', practiceId)
        .eq('role', 'kine')
        .order('firstname', { ascending: true })
        .order('lastname', { ascending: true })

      if (cancelled) return

      if (qErr) {
        setRows([])
        setError(qErr)
        setLoading(false)
        return
      }

      setRows(toArray(data).map(mapKineRow))
      setError(null)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [practiceId, tick])

  const members = useMemo(
    () =>
      rows.map((member) => ({
        ...member,
        isCurrentUser: currentProfileId != null && member.id === currentProfileId,
      })),
    [rows, currentProfileId]
  )

  return { members, loading, error, refetch }
}
