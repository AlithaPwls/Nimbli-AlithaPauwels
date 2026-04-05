import { useState, useEffect, useCallback, useRef } from 'react'
import supabase from '../lib/supabaseClient.js'
import { AuthContext } from './auth-context.js'

const SESSION_TIMEOUT_MS = 3_000

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

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms)
    }),
  ])
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
      return
    }
    setUser(sessionUser)
    let nextRole = null
    let nextProfile = null
    try {
      const row = await withTimeout(fetchProfileRow(sessionUser.id), SESSION_TIMEOUT_MS)
      nextRole = row.role
      nextProfile = row.profile
    } catch {
      /* network / timeout — keep user, clear role until next auth event */
    }
    setRole(nextRole)
    setProfile(nextProfile)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    try {
      const row = await withTimeout(fetchProfileRow(user.id), SESSION_TIMEOUT_MS)
      setRole(row.role)
      setProfile(row.profile)
    } catch {
      /* keep existing profile */
    }
  }, [user])

  useEffect(() => {
    initGenRef.current += 1
    const gen = initGenRef.current

    async function init() {
      let session = null
      try {
        const { data, error } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS)
        if (error) {
          session = null
        } else {
          session = data?.session ?? null
        }
      } catch {
        session = null
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
