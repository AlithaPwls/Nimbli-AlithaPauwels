import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useAuth } from '@/hooks/useAuth.js'

/**
 * Load a parent profile within the kine's practice (for sibling add flow).
 */
export function useKineParentProfile(parentId) {
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null

  const [parent, setParent] = useState(null)
  const [loading, setLoading] = useState(Boolean(parentId))
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!parentId || !practiceId) {
        setParent(null)
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, email, phone_number')
        .eq('id', parentId)
        .eq('role', 'parent')
        .eq('practice_id', practiceId)
        .maybeSingle()

      if (cancelled) return

      if (qErr) {
        setParent(null)
        setError(qErr)
        setLoading(false)
        return
      }

      setParent(data?.id ? data : null)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [parentId, practiceId])

  return { parent, loading, error }
}
