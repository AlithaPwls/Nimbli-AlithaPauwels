import { useState, useEffect, useCallback, useRef } from 'react'
import supabase from '../lib/supabaseClient.js'
import { AuthContext } from './auth-context.js'
import { APP_BUILD_ID } from '../lib/appVersion.js'

const SESSION_TIMEOUT_MS = 15_000
const PROFILE_TIMEOUT_MS = 3_000
const BUILD_ID_STORAGE_KEY = 'nimbli.appBuildId'
const PROFILE_CACHE_KEY = 'nimbli.profileCache.v1'

async function fetchProfileRow(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, firstname, lastname, email, role, practice_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return { role: null, profile: null }
  }
  return { role: data.role ?? null, profile: data }
}

function readCachedProfile(userId) {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.userId !== userId) return null
    if (!parsed.profile || !parsed.role) return null
    return { role: parsed.role, profile: parsed.profile }
  } catch {
    return null
  }
}

function writeCachedProfile(userId, roleValue, profileValue) {
  try {
    if (!userId || !roleValue || !profileValue) return
    localStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({
        userId,
        role: roleValue,
        profile: profileValue,
        cachedAt: Date.now(),
      })
    )
  } catch {
    // ignore
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms)
    }),
  ])
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const initGenRef = useRef(0)

  const applySession = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setUser(null)
      setRole(null)
      setProfile(null)
      try {
        localStorage.removeItem(PROFILE_CACHE_KEY)
      } catch {
        // ignore
      }
      return
    }
    setUser(sessionUser)
    const cached = readCachedProfile(sessionUser.id)
    if (cached?.role && cached?.profile) {
      setRole(cached.role)
      setProfile(cached.profile)
    }

    let nextRole = cached?.role ?? null
    let nextProfile = cached?.profile ?? null
    try {
      const row = await withTimeout(fetchProfileRow(sessionUser.id), PROFILE_TIMEOUT_MS)
      nextRole = row.role
      nextProfile = row.profile
    } catch {
      /* network / timeout — keep cached role/profile if present */
    }
    setRole(nextRole)
    setProfile(nextProfile)
    if (nextRole && nextProfile) {
      writeCachedProfile(sessionUser.id, nextRole, nextProfile)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const row = await withTimeout(fetchProfileRow(user.id), PROFILE_TIMEOUT_MS)
      setRole(row.role)
      setProfile(row.profile)
      if (row.role && row.profile) {
        writeCachedProfile(user.id, row.role, row.profile)
      }
    } catch {
      /* keep existing profile */
    }
  }, [user])

  useEffect(() => {
    initGenRef.current += 1
    const gen = initGenRef.current

    async function init() {
      // Force logout when the running app build changes (dev restart or prod redeploy).
      // Supabase persists sessions in browser storage; this is intentional invalidation.
      try {
        const previous = localStorage.getItem(BUILD_ID_STORAGE_KEY)
        if (previous && previous !== APP_BUILD_ID) {
          await supabase.auth.signOut()
        }
        localStorage.setItem(BUILD_ID_STORAGE_KEY, APP_BUILD_ID)
      } catch {
        // storage may be blocked; skip build-based invalidation
      }

      let session = null
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const { data, error } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS)
          if (error) {
            session = null
          } else {
            session = data?.session ?? null
          }
          break
        } catch {
          if (attempt === 2) {
            session = null
            break
          }
          await sleep(250 * (attempt + 1) * (attempt + 1))
        }
      }

      if (gen !== initGenRef.current) {
        return
      }

      try {
        await applySession(session?.user ?? null)
      } catch {
        setUser(null)
        setRole(null)
        setProfile(null)
      }
      if (gen === initGenRef.current) {
        setLoading(false)
      }
    }

    void init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (gen !== initGenRef.current) {
          return
        }
        try {
          await applySession(session?.user ?? null)
        } catch {
          setUser(null)
          setRole(null)
          setProfile(null)
        }
        if (gen === initGenRef.current) {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [applySession])

  const value = { user, role, profile, loading, refreshProfile }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
