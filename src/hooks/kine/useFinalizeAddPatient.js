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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function uniqueExerciseIdsFromDraft(draft) {
  const raw = draft?.selectedExerciseIds
  if (!Array.isArray(raw) || raw.length === 0) return []
  return [...new Set(raw.map((x) => String(x).trim()).filter(Boolean))]
}

export function useFinalizeAddPatient() {
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null
  const kineProfileId = profile?.id ?? null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inviteCode, setInviteCode] = useState(null)

  const canFinalize = useMemo(
    () => Boolean(practiceId && kineProfileId),
    [practiceId, kineProfileId]
  )

  const finalize = useCallback(
    async (draft) => {
      setError(null)
      setInviteCode(null)

      if (!practiceId) {
        setError('Je praktijk is nog niet gekoppeld. Rond eerst je praktijkregistratie af.')
        return { ok: false }
      }
      if (!kineProfileId) {
        setError('Je profiel is niet geladen. Vernieuw de pagina en probeer opnieuw.')
        return { ok: false }
      }

      const childFirstname = normalizeName(draft?.childFirstname)
      const childLastname = normalizeName(draft?.childLastname)
      const parentFirstname = normalizeName(draft?.parentFirstname)
      const parentLastname = normalizeName(draft?.parentLastname)
      const parentEmail = normalizeEmail(draft?.parentEmail)
      const treatmentGoal = normalizeName(draft?.focus)

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

      const childDob = draft?.childDob ? String(draft.childDob) : null

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

        const childProfileId = newId()
        const parentProfileId = newId()

        const rows = [
          {
            id: childProfileId,
            firstname: childFirstname,
            lastname: childLastname,
            email: childEmailPlaceholder,
            role: 'child',
            invite_code: code,
            practice_id: practiceId,
            date_of_birth: childDob || null,
            treatment_goal: treatmentGoal || null,
          },
          {
            id: parentProfileId,
            firstname: parentFirstname,
            lastname: parentLastname,
            email: parentEmail,
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

        const { error: relErr } = await supabase.from('child_parent_relations').insert({
          parent_id: parentProfileId,
          child_id: childProfileId,
        })
        if (relErr) {
          setError('Koppeling ouder-kind mislukt. Probeer opnieuw.')
          return { ok: false }
        }

        const exerciseIds = uniqueExerciseIdsFromDraft(draft)
        if (exerciseIds.length > 0) {
          const assignmentRows = exerciseIds.map((exerciseId) => ({
            child_id: childProfileId,
            exercise_id: exerciseId,
            assigned_by: kineProfileId,
          }))

          const { error: assignErr } = await supabase.from('exercise_assignments').insert(assignmentRows)
          if (assignErr) {
            setError(
              'Oefeningen koppelen mislukt. Profielen zijn wel aangemaakt; wijs oefeningen later opnieuw toe.'
            )
            return { ok: false }
          }
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
    [practiceId, kineProfileId]
  )

  return { finalize, loading, error, inviteCode, canFinalize }
}
