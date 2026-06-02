import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { readActiveChildId, writeActiveChildId } from '@/lib/activeChild.js'
import { useChildrenForParent } from '@/hooks/ouder/useChildrenForParent.js'

/**
 * Shared parent UI state: linked children + selected child (?child= + localStorage).
 * Only activated children (user_id set) appear in switchers / dashboard data.
 */
export function useActiveChildSelection(parentProfile) {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    children,
    activatedChildren,
    pendingChildren,
    derived,
    loading,
    error,
    refetch,
    patchChild,
  } = useChildrenForParent(parentProfile)

  const childParam = searchParams.get('child')
  const [selectedChildId, setSelectedChildIdState] = useState(() =>
    readActiveChildId(searchParams)
  )

  useEffect(() => {
    const fromUrl = childParam?.trim() || null
    if (fromUrl && fromUrl !== selectedChildId) {
      setSelectedChildIdState(fromUrl)
      writeActiveChildId(fromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childParam])

  const setSelectedChildId = useCallback(
    (id) => {
      setSelectedChildIdState(id)
      writeActiveChildId(id)
      const next = new URLSearchParams(searchParams)
      if (id) next.set('child', id)
      else next.delete('child')
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (loading) return

    const list = activatedChildren ?? []
    if (list.length === 0) return

    const valid = list.some((c) => c?.id === selectedChildId)
    if (valid) return

    const firstId = list[0]?.id
    if (firstId) setSelectedChildId(firstId)
  }, [activatedChildren, loading, selectedChildId, setSelectedChildId])

  const activeChildId = useMemo(() => {
    const list = activatedChildren ?? []
    if (list.some((c) => c?.id === selectedChildId)) return selectedChildId
    return list[0]?.id ?? null
  }, [activatedChildren, selectedChildId])

  const selectedChild = useMemo(() => {
    return (activatedChildren ?? []).find((c) => c?.id === activeChildId) ?? null
  }, [activatedChildren, activeChildId])

  return {
    children,
    activatedChildren,
    pendingChildren,
    derived,
    loading,
    error,
    refetch,
    patchChild,
    selectedChildId,
    activeChildId,
    selectedChild,
    setSelectedChildId,
  }
}
