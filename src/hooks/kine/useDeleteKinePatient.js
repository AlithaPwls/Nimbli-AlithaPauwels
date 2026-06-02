import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

const FUNCTION_NAME = 'delete-kine-patient'

const ERROR_MESSAGES = {
  unauthorized: 'Je sessie is verlopen. Log opnieuw in en probeer het opnieuw.',
  forbidden: 'Je hebt geen toegang om deze patiënt te verwijderen.',
  not_found: 'Patiënt niet gevonden.',
  invalid_payload: 'Ongeldige aanvraag.',
  invalid_json: 'Onverwacht antwoord van de server.',
  server_misconfigured: 'Verwijderen is niet geconfigureerd op de server. Neem contact op met de beheerder.',
  delete_failed: 'Verwijderen mislukt. Probeer het later opnieuw.',
  method_not_allowed: 'Verwijderen mislukt. Probeer het later opnieuw.',
}

function friendlyMessage(code, fallback = 'Verwijderen mislukt. Probeer het later opnieuw.') {
  if (code && Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code)) {
    return ERROR_MESSAGES[code]
  }
  return fallback
}

function normalizeBody(raw) {
  if (raw == null) return null
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

function collectErrorText(body, invokeError) {
  const parts = [
    body?.details,
    body?.error,
    body?.message,
    invokeError?.message,
    invokeError?.details,
  ]
  if (invokeError && typeof invokeError === 'object' && invokeError.context) {
    const ctx = invokeError.context
    parts.push(ctx.body, ctx.message)
  }
  return parts.filter(Boolean).join(' ')
}

/**
 * Oude edge function gaf 500 nadat het kind al weg was (ouder-delete geblokkeerd door trigger).
 * Dat is inhoudelijk geslaagd: kind weg, ouder + siblings blijven.
 */
function isSuccessfulPartialDelete(body, invokeError) {
  const blob = collectErrorText(body, invokeError)
  return blob.includes('parent_profile_has_linked_children')
}

async function readInvokeBody(data, invokeError) {
  const direct = normalizeBody(data)
  if (direct) return direct

  const ctx = invokeError?.context
  if (ctx) {
    const fromCtx = normalizeBody(ctx.body ?? ctx.data)
    if (fromCtx) return fromCtx
  }

  const response = ctx?.response
  if (response && typeof response.clone === 'function') {
    try {
      const cloned = response.clone()
      const parsed = await cloned.json()
      return normalizeBody(parsed)
    } catch {
      try {
        const text = await response.clone().text()
        return normalizeBody(text)
      } catch {
        // ignore
      }
    }
  }

  return null
}

async function isChildProfileDeleted(patientId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', patientId)
    .eq('role', 'child')
    .maybeSingle()

  if (error) return false
  return !data?.id
}

/**
 * Verwijdert een kind-profiel via edge function (sessies, toewijzingen, Auth).
 * Ouder wordt alleen mee verwijderd als dit het laatste gekoppelde kind is.
 */
export function useDeleteKinePatient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const deletePatient = useCallback(async ({ patientId }) => {
    setError(null)

    if (!patientId) {
      setError('Patiënt ontbreekt.')
      return { ok: false }
    }

    setLoading(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { childId: patientId },
      })

      const body = await readInvokeBody(data, invokeError)

      if (body?.ok === true) {
        return { ok: true, body }
      }

      if (isSuccessfulPartialDelete(body, invokeError)) {
        return { ok: true, body, recoveredFromStaleError: true }
      }

      const childGone = await isChildProfileDeleted(patientId)
      if (childGone) {
        return { ok: true, body, recoveredFromStaleError: true }
      }

      const code = typeof body?.error === 'string' ? body.error : null
      setError(friendlyMessage(code))
      return { ok: false }
    } catch {
      const childGone = await isChildProfileDeleted(patientId)
      if (childGone) {
        return { ok: true, recoveredFromStaleError: true }
      }
      setError('Verwijderen mislukt. Probeer het later opnieuw.')
      return { ok: false }
    } finally {
      setLoading(false)
    }
  }, [])

  return { deletePatient, loading, error, clearError: () => setError(null) }
}
