import { useCallback, useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

function childSortKey(row) {
  const name = `${row?.firstname ?? ''} ${row?.lastname ?? ''}`.trim()
  return name.toLowerCase()
}

function mapRelationRow(row) {
  const child = row?.child
  if (!child?.id) return null
  return {
    ...child,
    role_parent: row?.role_parent ?? null,
    isPending: child.user_id == null,
  }
}

/**
 * Parent helper: loads all linked child profiles via child_parent_relations.
 */
export function useChildrenForParent(parentProfile) {
  const parentProfileId = parentProfile?.id ?? null

  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(Boolean(parentProfileId))
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  const patchChild = useCallback((childId, patch) => {
    if (!childId || !patch) return
    setChildren((prev) =>
      (prev ?? []).map((c) => (c?.id === childId ? { ...c, ...patch } : c))
    )
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!parentProfileId) {
        setChildren([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('child_parent_relations')
        .select(
          `
          role_parent,
          child:profiles!child_id (
            id, firstname, lastname, date_of_birth, created_at,
            avatar_url, role, invite_code, user_id, treatment_goal
          )
        `
        )
        .eq('parent_id', parentProfileId)

      if (cancelled) return

      if (qErr) {
        setChildren([])
        setError(qErr)
        setLoading(false)
        return
      }

      const list = (Array.isArray(data) ? data : [])
        .map(mapRelationRow)
        .filter((c) => c && c.role === 'child')
      list.sort((a, b) => childSortKey(a).localeCompare(childSortKey(b), 'nl'))

      setChildren(list)
      setError(null)
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [parentProfileId, tick])

  const activatedChildren = useMemo(
    () => (children ?? []).filter((c) => !c.isPending),
    [children]
  )

  const pendingChildren = useMemo(
    () => (children ?? []).filter((c) => c.isPending),
    [children]
  )

  const derived = useMemo(() => {
    return (children ?? []).map((c) => {
      const firstname = c?.firstname?.trim() || '—'
      const lastname = c?.lastname?.trim() || ''
      const fullName = `${firstname}${lastname ? ` ${lastname}` : ''}`.trim()
      return { id: c?.id, fullName }
    })
  }, [children])

  return {
    children,
    activatedChildren,
    pendingChildren,
    derived,
    loading,
    error,
    refetch,
    patchChild,
  }
}
