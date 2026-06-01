import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import supabase from '@/lib/supabaseClient.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'

/** Active child profile fields for kind overview. */
export function useKindChildProfile() {
  const { pathname } = useLocation()
  const { childId, loading: childLoading, error: childError } = useActiveChildId()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(childId))
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (childLoading) return

      if (childError) {
        setProfile(null)
        setLoading(false)
        setError(childError)
        return
      }

      if (!childId) {
        setProfile(null)
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('firstname, lastname, date_of_birth, avatar_url')
        .eq('id', childId)
        .maybeSingle()

      if (cancelled) return

      if (qErr) {
        setProfile(null)
        setError(qErr)
        setLoading(false)
        return
      }

      setProfile(data ?? null)
      setError(null)
      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [childId, childLoading, childError, pathname])

  return {
    profile,
    loading: childLoading || loading,
    error,
  }
}
