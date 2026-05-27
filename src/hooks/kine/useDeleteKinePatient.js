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

async function parseFunctionsError(invokeError) {
  const response = invokeError?.context?.response
  if (response && typeof response.json === 'function') {
    try {
      const body = await response.json()
      return {
        code: typeof body?.error === 'string' ? body.error : null,
        details: typeof body?.details === 'string' ? body.details : null,
        body,
      }
    } catch {
      return { code: null, details: invokeError?.message ?? null, body: null }
    }
  }
  return { code: null, details: invokeError?.message ?? null, body: null }
}

/**
 * Verwijdert een patiënt (kind + gekoppelde ouder) via edge function:
 * profiles, sessies, toewijzingen én Auth-accounts indien geregistreerd.
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

      if (invokeError) {
        const parsed = await parseFunctionsError(invokeError)
        setError(friendlyMessage(parsed.code))
        return { ok: false }
      }

      if (!data?.ok) {
        const code = typeof data?.error === 'string' ? data.error : null
        setError(friendlyMessage(code))
        return { ok: false }
      }

      return { ok: true }
    } catch {
      setError('Verwijderen mislukt. Probeer het later opnieuw.')
      return { ok: false }
    } finally {
      setLoading(false)
    }
  }, [])

  return { deletePatient, loading, error, clearError: () => setError(null) }
}
