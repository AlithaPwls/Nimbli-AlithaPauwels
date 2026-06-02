import { useCallback, useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useAuth } from '@/hooks/useAuth.js'

/**
 * Search parent profiles within the kine's practice (for linking a new child).
 */
export function useKineParentsSearch(query) {
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null

  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = useCallback(
    async (q) => {
      const term = String(q ?? '').trim()
      if (!practiceId || term.length < 2) {
        setParents([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, email, phone_number')
        .eq('role', 'parent')
        .eq('practice_id', practiceId)
        .order('lastname', { ascending: true })
        .limit(100)

      if (qErr) {
        setParents([])
        setError(qErr)
        setLoading(false)
        return
      }

      const lower = term.toLowerCase()
      const filtered = (Array.isArray(data) ? data : []).filter((p) => {
        const hay = `${p?.firstname ?? ''} ${p?.lastname ?? ''} ${p?.email ?? ''}`.toLowerCase()
        return hay.includes(lower)
      })
      setParents(filtered.slice(0, 20))
      setLoading(false)
      setError(null)
    },
    [practiceId]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      void search(query)
    }, 300)
    return () => clearTimeout(t)
  }, [query, search])

  return { parents, loading, error, refetch: search }
}
