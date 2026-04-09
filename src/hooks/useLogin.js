import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/supabaseClient.js'

const VALID_ROLES = ['child', 'parent', 'kine']

const ROLE_PATH = {
  child: '/dashboard/kind',
  parent: '/dashboard/ouder',
  kine: '/dashboard/kine',
}

/**
 * Email/password login. Invalid or missing profile → sign out + user-facing error (checklist C7).
 * "Onthoud mij" is UI-only for now; Supabase client keeps default persisted session (localStorage).
 */
export function useLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  const login = useCallback(
    async ({ email, password }) => {
      setError(null)
      setLoading(true)

      try {
        // Explicitly switch sessions: if someone is already logged in, log them out first.
        // This matches the requirement that logging in from /login replaces the current user.
        try {
          const { data } = await supabase.auth.getSession()
          if (data?.session?.user) {
            await supabase.auth.signOut()
          }
        } catch {
          // ignore (we'll attempt sign-in regardless)
        }

        const { data, error: signError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signError) {
          setError('Email of wachtwoord klopt niet')
          return { ok: false }
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile?.role || !VALID_ROLES.includes(profile.role)) {
          setError(
            'Je account is nog niet volledig ingesteld (profiel ontbreekt of is niet toegankelijk). Neem contact op met je kinesist.'
          )
          try {
            await supabase.auth.signOut()
          } catch {
            // ignore
          }
          return { ok: false }
        }

        const path = ROLE_PATH[profile.role]
        navigate(path, { replace: true })
        return { ok: true }
      } catch {
        setError('Inloggen mislukt. Probeer het later opnieuw.')
        return { ok: false }
      } finally {
        setLoading(false)
      }
    },
    [navigate]
  )

  return { login, loading, error, clearError }
}
