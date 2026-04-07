import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

export function useKineDashboardKpis({ practiceId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [kpis, setKpis] = useState({
    totalPatients: 0,
    adherencePct: null,
    compliancePct: null,
  })

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!practiceId) {
        setKpis({ totalPatients: 0, adherencePct: null, compliancePct: null })
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { count, error: cErr } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('practice_id', practiceId)
        .eq('role', 'child')

      if (cancelled) return

      if (cErr) {
        setError(cErr)
        setLoading(false)
        return
      }

      setKpis((prev) => ({
        ...prev,
        totalPatients: typeof count === 'number' ? count : 0,
      }))
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [practiceId])

  return { kpis, loading, error }
}

