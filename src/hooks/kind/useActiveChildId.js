import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useAuth } from '@/hooks/useAuth.js'

/**
 * Kind context helper: resolves the active child profile id.
 * - Child session: profile.id
 * - Parent session on kind dashboard: child with same invite_code
 */
export function useActiveChildId() {
  const { role, profile } = useAuth()
  const [childId, setChildId] = useState(null)
  const [loading, setLoading] = useState(Boolean(profile?.id))
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!profile?.id) {
        setChildId(null)
        setLoading(false)
        setError(null)
        return
      }

      if (role === 'child') {
        setChildId(profile.id)
        setLoading(false)
        setError(null)
        return
      }

      if (role === 'parent' && profile.invite_code) {
        setLoading(true)
        setError(null)
        const { data, error: qErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('invite_code', profile.invite_code)
          .eq('role', 'child')
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (qErr) {
          setChildId(null)
          setLoading(false)
          setError(qErr)
          return
        }
        setChildId(data?.id ?? null)
        setLoading(false)
        setError(null)
        return
      }

      setChildId(null)
      setLoading(false)
      setError(null)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [role, profile?.id, profile?.invite_code])

  return { childId, loading, error }
}

