export const ACTIVE_CHILD_STORAGE_KEY = 'nimbli.activeChildId'

export function readActiveChildIdFromStorage() {
  try {
    const raw = localStorage.getItem(ACTIVE_CHILD_STORAGE_KEY)
    return raw?.trim() || null
  } catch {
    return null
  }
}

export function writeActiveChildId(id) {
  try {
    if (!id) {
      localStorage.removeItem(ACTIVE_CHILD_STORAGE_KEY)
      return
    }
    localStorage.setItem(ACTIVE_CHILD_STORAGE_KEY, id)
  } catch {
    // ignore
  }
}

/**
 * @param {URLSearchParams | null | undefined} searchParams
 */
export function readActiveChildId(searchParams) {
  const fromUrl = searchParams?.get('child')?.trim()
  if (fromUrl) return fromUrl
  return readActiveChildIdFromStorage()
}

/**
 * Child id for kind routes: child session → own profile only; parent → ?child= / storage.
 */
export function resolveKindRouteChildId({ role, profile, searchParams }) {
  if (role === 'child') return profile?.id ?? null
  if (role === 'parent') return readActiveChildId(searchParams)
  return null
}

export function buildChildSearch(childId) {
  if (!childId) return ''
  return `?child=${encodeURIComponent(childId)}`
}

export function withChildSearch(pathname, childId) {
  const search = buildChildSearch(childId)
  return search ? { pathname, search } : pathname
}

/** @param {URLSearchParams} params */
export function applyActiveChildToParams(params, childId) {
  if (childId) params.set('child', childId)
  return params
}
