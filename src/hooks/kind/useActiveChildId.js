import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ACTIVE_CHILD_STORAGE_KEY,
  readActiveChildId,
  writeActiveChildId,
} from '@/lib/activeChild.js'
import { useAuth } from '@/hooks/useAuth.js'
import { useChildrenForParent } from '@/hooks/ouder/useChildrenForParent.js'
import { useSiblingsForChild } from '@/hooks/kind/useSiblingsForChild.js'

/**
 * Resolves the active child profile id.
 * - Child session: profile.id
 * - Parent on kind dashboard: ?child= validated against child_parent_relations
 */
export function useActiveChildId() {
  const { role, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { children, loading: childrenLoading } = useChildrenForParent(
    role === 'parent' ? profile : null
  )
  const { siblings, loading: siblingsLoading } = useSiblingsForChild(
    role === 'child' ? profile : null
  )

  const kindSwitcherChildren = role === 'parent' ? children : siblings
  const kindSwitcherLoading =
    role === 'parent' ? childrenLoading : siblingsLoading

  const requestedId = useMemo(() => readActiveChildId(searchParams), [searchParams])

  const resolvedId = useMemo(() => {
    if (role === 'child' && profile?.id) return profile.id
    if (role !== 'parent' || !profile?.id) return null
    if (!Array.isArray(children) || children.length === 0) return null

    if (requestedId && children.some((c) => c?.id === requestedId)) {
      return requestedId
    }
    return children[0]?.id ?? null
  }, [role, profile?.id, children, requestedId])

  const [childId, setChildId] = useState(resolvedId)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role === 'child') {
      setChildId(profile?.id ?? null)
      setLoading(siblingsLoading)

      if (searchParams.has('child')) {
        const next = new URLSearchParams(searchParams)
        next.delete('child')
        setSearchParams(next, { replace: true })
      }
      try {
        localStorage.removeItem(ACTIVE_CHILD_STORAGE_KEY)
      } catch {
        // ignore
      }
      return
    }

    if (role === 'parent') {
      if (childrenLoading) {
        setLoading(true)
        return
      }
      setChildId(resolvedId)
      setLoading(false)

      if (resolvedId && resolvedId !== searchParams.get('child')) {
        const next = new URLSearchParams(searchParams)
        next.set('child', resolvedId)
        setSearchParams(next, { replace: true })
        writeActiveChildId(resolvedId)
      }
      return
    }

    setChildId(null)
    setLoading(false)
  }, [role, profile?.id, resolvedId, childrenLoading, siblingsLoading, searchParams, setSearchParams])

  return {
    childId,
    loading,
    error: null,
    children: kindSwitcherChildren,
    kindSwitcherLoading,
  }
}
