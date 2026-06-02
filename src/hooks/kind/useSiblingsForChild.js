import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

/**
 * Siblings of the logged-in child (same parent via child_parent_relations).
 * Used in kind sidebar so a child can request another child's view (with parent password).
 */
export function useSiblingsForChild(childProfile) {
  const childId = childProfile?.id ?? null
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(Boolean(childId))

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!childId) {
        setSiblings([])
        setLoading(false)
        return
      }

      setLoading(true)

      const { data: rel, error: relErr } = await supabase
        .from('child_parent_relations')
        .select('parent_id')
        .eq('child_id', childId)
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (relErr || !rel?.parent_id) {
        setSiblings([])
        setLoading(false)
        return
      }

      const { data: rows, error: sibErr } = await supabase
        .from('child_parent_relations')
        .select(
          'child:profiles!child_id ( id, firstname, lastname, avatar_url, role, user_id )'
        )
        .eq('parent_id', rel.parent_id)

      if (cancelled) return

      if (sibErr) {
        setSiblings([])
        setLoading(false)
        return
      }

      const list = (Array.isArray(rows) ? rows : [])
        .map((r) => r?.child)
        .filter((c) => c?.id && c.role === 'child')

      setSiblings(list)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [childId])

  return { siblings, loading }
}
