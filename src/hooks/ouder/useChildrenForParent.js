import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

function childSortKey(row) {
  const name = `${row?.firstname ?? ''} ${row?.lastname ?? ''}`.trim()
  return name.toLowerCase()
}

/**
 * Parent helper: loads all linked child profile rows (same invite_code).
 */
export function useChildrenForParent(parentProfile) {
  const inviteCode = parentProfile?.invite_code ?? null
  const parentProfileId = parentProfile?.id ?? null

  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(Boolean(inviteCode))
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!inviteCode) {
        setChildren([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, date_of_birth, created_at, avatar_url, role, invite_code')
        .eq('invite_code', inviteCode)

      if (cancelled) return

      if (qErr) {
        setChildren([])
        setError(qErr)
        setLoading(false)
        return
      }

      const list = Array.isArray(data) ? [...data] : []
      const filtered = list.filter((r) => {
        if (parentProfileId && r?.id === parentProfileId) return false
        if (typeof r?.role === 'string') return r.role === 'child'
        // If role is missing/unexpected, best-effort: treat "not the parent row" as child.
        return true
      })
      filtered.sort((a, b) => childSortKey(a).localeCompare(childSortKey(b), 'nl'))

      setChildren(filtered)
      setError(null)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [inviteCode, parentProfileId])

  const derived = useMemo(() => {
    return (children ?? []).map((c) => {
      const firstname = c?.firstname?.trim() || '—'
      const lastname = c?.lastname?.trim() || ''
      const fullName = `${firstname}${lastname ? ` ${lastname}` : ''}`.trim()
      return { id: c?.id, fullName }
    })
  }, [children])

  return { children, derived, loading, error }
}

