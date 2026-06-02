import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { readActiveChildId, withChildSearch } from '@/lib/activeChild.js'
import { useAuth } from '@/hooks/useAuth.js'

/**
 * Navigate on kind routes while preserving ?child= for parent sessions.
 */
export function useKindNavigate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { role } = useAuth()

  const childId = role === 'parent' ? readActiveChildId(searchParams) : null

  const kindNavigate = useCallback(
    (to, options) => {
      if (typeof to === 'string') {
        if (role === 'parent' && childId) {
          navigate(withChildSearch(to, childId), options)
          return
        }
        navigate(to, options)
        return
      }
      if (role === 'parent' && childId && to?.pathname) {
        navigate(
          {
            ...to,
            search: to.search ?? `?child=${encodeURIComponent(childId)}`,
          },
          options
        )
        return
      }
      navigate(to, options)
    },
    [navigate, role, childId]
  )

  return kindNavigate
}
