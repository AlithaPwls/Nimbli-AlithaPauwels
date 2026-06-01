import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { parseFunctionsError } from '@/lib/kine/parseFunctionsError.js'

const FUNCTION_NAME = 'delete-kine-team-member'

const ERROR_MESSAGES = {
  unauthorized: 'Je sessie is verlopen. Log opnieuw in en probeer het opnieuw.',
  forbidden: 'Je hebt geen toegang om deze gebruiker te verwijderen.',
  not_found: 'Gebruiker niet gevonden.',
  cannot_delete_self: 'Je kunt je eigen account niet verwijderen. Gebruik Log uit als je wilt stoppen.',
  delete_failed: 'Verwijderen mislukt. Probeer het later opnieuw.',
}

function isLikelyNetworkOrCorsError(message) {
  const m = String(message ?? '').toLowerCase()
  return (
    m.includes('cors') ||
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('load failed')
  )
}

function friendlyMessage(code, details) {
  if (code && Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code)) {
    return ERROR_MESSAGES[code]
  }
  if (isLikelyNetworkOrCorsError(details)) {
    return 'Verwijderen is tijdelijk niet bereikbaar. Vernieuw de pagina en probeer opnieuw.'
  }
  return 'Verwijderen mislukt. Probeer het later opnieuw.'
}

export function useDeleteKineTeamMember() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const deleteMember = useCallback(async ({ kineId }) => {
    setError(null)

    if (!kineId) {
      setError('Gebruiker ontbreekt.')
      return { ok: false }
    }

    setLoading(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { kineId },
      })

      if (invokeError) {
        const parsed = await parseFunctionsError(invokeError)
        setError(friendlyMessage(parsed.code, parsed.details ?? invokeError.message))
        return { ok: false }
      }

      if (!data?.ok) {
        const code = typeof data?.error === 'string' ? data.error : null
        setError(friendlyMessage(code, data?.details))
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

  return { deleteMember, loading, error, clearError: () => setError(null) }
}
