import { useCallback, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useAuth } from '@/hooks/useAuth.js'

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function generateSixDigitCode() {
  const n = Math.floor(Math.random() * 1_000_000)
  return String(n).padStart(6, '0')
}

function normalizeName(value) {
  return String(value ?? '').trim()
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function isValidEmail(value) {
  const v = normalizeEmail(value)
  if (!v) return false
  // pragmatic validation; Supabase will enforce stricter rules at signUp time
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // extremely old browsers fallback (shouldn't happen in modern Vite apps)
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useCreatePatientInvite() {
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inviteCode, setInviteCode] = useState(null)

  const canCreate = useMemo(() => Boolean(practiceId), [practiceId])

  const clear = useCallback(() => {
    setError(null)
    setInviteCode(null)
  }, [])

  const createInvite = useCallback(
    async (input) => {
      setError(null)
      setInviteCode(null)

      if (!practiceId) {
        setError('Je praktijk is nog niet gekoppeld. Rond eerst je praktijkregistratie af.')
        return { ok: false }
      }

      const childFirstname = normalizeName(input?.childFirstname)
      const childLastname = normalizeName(input?.childLastname)
      const parentFirstname = normalizeName(input?.parentFirstname)
      const parentLastname = normalizeName(input?.parentLastname)
      const parentEmail = normalizeEmail(input?.parentEmail)

      if (!childFirstname || !childLastname) {
        setError('Vul de voornaam en achternaam van de patiënt in.')
        return { ok: false }
      }
      if (!parentFirstname || !parentLastname) {
        setError('Vul de voornaam en achternaam van de ouder/voogd in.')
        return { ok: false }
      }
      if (!isValidEmail(parentEmail)) {
        setError('Vul een geldig emailadres in voor de ouder/voogd.')
        return { ok: false }
      }

      const childDob = input?.childDob ? String(input.childDob) : null

      setLoading(true)
      try {
        let code = null
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const next = onlyDigits(generateSixDigitCode())
          const codeWithDash = `${next.slice(0, 3)}-${next.slice(3)}`

          const { count, error: checkErr } = await supabase
            .from('profiles')
            .select('id', { head: true, count: 'exact' })
            .in('invite_code', [next, codeWithDash])

          if (checkErr) {
            setError('Kon geen uitnodigingscode maken. Probeer later opnieuw.')
            return { ok: false }
          }

          if ((count ?? 0) === 0) {
            code = next
            break
          }
        }

        if (!code) {
          setError('Kon geen unieke uitnodigingscode maken. Probeer opnieuw.')
          return { ok: false }
        }

        const childEmailPlaceholder = `kind.${code}@pending.local`
        const parentEmailValue = parentEmail || `ouder.${code}@pending.local`

        const rows = [
          {
            id: newId(),
            firstname: childFirstname,
            lastname: childLastname,
            email: childEmailPlaceholder,
            role: 'child',
            invite_code: code,
            practice_id: practiceId,
            date_of_birth: childDob || null,
          },
          {
            id: newId(),
            firstname: parentFirstname,
            lastname: parentLastname,
            email: parentEmailValue,
            role: 'parent',
            invite_code: code,
            practice_id: practiceId,
          },
        ]

        const { error: insErr } = await supabase.from('profiles').insert(rows)
        if (insErr) {
          setError('Opslaan mislukt. Controleer je invoer en probeer opnieuw.')
          return { ok: false }
        }

        setInviteCode(code)
        return { ok: true, inviteCode: code }
      } catch {
        setError('Opslaan mislukt. Probeer het later opnieuw.')
        return { ok: false }
      } finally {
        setLoading(false)
      }
    },
    [practiceId]
  )

  return { createInvite, loading, error, inviteCode, canCreate, clear }
}

