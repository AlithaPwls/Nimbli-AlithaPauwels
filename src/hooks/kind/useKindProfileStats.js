import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import supabase from '@/lib/supabaseClient.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'

/**
 * Kind Overzicht stats from profiles (total_xp live; trophies/stars still mock until badges exist).
 */
export function useKindProfileStats() {
  const { pathname } = useLocation()
  const { childId, loading: childLoading, error: childError } = useActiveChildId()
  const [totalXp, setTotalXp] = useState(0)
  const [loading, setLoading] = useState(Boolean(childId))
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (childLoading) return

      if (childError) {
        setTotalXp(0)
        setLoading(false)
        setError(childError)
        return
      }

      if (!childId) {
        setTotalXp(0)
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', childId)
        .maybeSingle()

      if (cancelled) return

      if (qErr) {
        setTotalXp(0)
        setError(qErr)
        setLoading(false)
        return
      }

      const xp = data?.total_xp
      setTotalXp(typeof xp === 'number' && Number.isFinite(xp) ? Math.max(0, Math.round(xp)) : 0)
      setError(null)
      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [childId, childLoading, childError, pathname])

  return {
    totalXp,
    loading: childLoading || loading,
    error,
  }
}
