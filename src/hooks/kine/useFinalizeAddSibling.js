import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useAuth } from '@/hooks/useAuth.js'
import { childPendingEmailFromInviteCode } from '@/lib/childAuthEmail.js'
import {
  normalizeScheduleDays,
  scheduleDaysByExerciseIdFromDraft,
} from '@/lib/kine/exerciseScheduleDays.js'

const MAX_CHILDREN_PER_PARENT = 10

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

function repsByExerciseIdFromDraft(draft) {
  const raw = draft?.exerciseRepsById
  if (!raw || typeof raw !== 'object') return {}
  return raw
}

function parseReps(raw, fallback = 10) {
  if (raw == null || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.max(1, Math.round(n))
}

export function useFinalizeAddSibling() {
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null
  const kineProfileId = profile?.id ?? null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inviteCode, setInviteCode] = useState(null)

  const finalize = useCallback(
    async (draft) => {
      setError(null)
      setInviteCode(null)

      if (!practiceId || !kineProfileId) {
        setError('Je bent niet gekoppeld aan een praktijk.')
        return { ok: false }
      }

      const existingParentId = draft?.existingParentId ?? null
      if (!existingParentId) {
        setError('Kies een bestaande ouder om het kind aan te koppelen.')
        return { ok: false }
      }

      const childFirstname = normalizeName(draft?.childFirstname)
      const childLastname = normalizeName(draft?.childLastname)
      const treatmentGoal = normalizeName(draft?.focus)
      const childDob = draft?.childDob ? String(draft.childDob) : null

      if (!childFirstname || !childLastname) {
        setError('Vul de voornaam en achternaam van de patiënt in.')
        return { ok: false }
      }

      const { count: siblingCount, error: countErr } = await supabase
        .from('child_parent_relations')
        .select('id', { head: true, count: 'exact' })
        .eq('parent_id', existingParentId)

      if (countErr) {
        setError('Kon gezinsgegevens niet controleren.')
        return { ok: false }
      }

      if ((siblingCount ?? 0) >= MAX_CHILDREN_PER_PARENT) {
        setError(`Een ouder kan maximaal ${MAX_CHILDREN_PER_PARENT} kinderen hebben.`)
        return { ok: false }
      }

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

        const childProfileId = newId()

        const { error: insChildErr } = await supabase.from('profiles').insert({
          id: childProfileId,
          firstname: childFirstname,
          lastname: childLastname,
          email: childPendingEmailFromInviteCode(code),
          role: 'child',
          invite_code: code,
          practice_id: practiceId,
          date_of_birth: childDob || null,
          treatment_goal: treatmentGoal || null,
        })

        if (insChildErr) {
          setError('Opslaan mislukt. Controleer je invoer en probeer opnieuw.')
          return { ok: false }
        }

        const { error: relErr } = await supabase.from('child_parent_relations').insert({
          parent_id: existingParentId,
          child_id: childProfileId,
          role_parent: draft?.parentRelation?.trim() || null,
        })

        if (relErr) {
          setError('Koppeling ouder-kind mislukt. Probeer opnieuw.')
          return { ok: false }
        }

        const exerciseIds = uniqueExerciseIdsFromDraft(draft)
        if (exerciseIds.length > 0) {
          const repsById = repsByExerciseIdFromDraft(draft)
          const scheduleById = scheduleDaysByExerciseIdFromDraft(draft)
          const assignmentRows = exerciseIds.map((exerciseId) => ({
            child_id: childProfileId,
            exercise_id: exerciseId,
            assigned_by: kineProfileId,
            schedule_days: normalizeScheduleDays(scheduleById?.[exerciseId]),
            reps: parseReps(repsById?.[exerciseId], 10),
          }))

          const { error: assignErr } = await supabase.from('exercise_assignments').insert(assignmentRows)
          if (assignErr) {
            setError(
              'Oefeningen koppelen mislukt. Het kindprofiel is wel aangemaakt; wijs oefeningen later opnieuw toe.'
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

  return { finalize, loading, error, inviteCode }
}
