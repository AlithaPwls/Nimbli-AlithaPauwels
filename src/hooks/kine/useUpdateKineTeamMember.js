import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { parseFunctionsError } from '@/lib/kine/parseFunctionsError.js'

const FUNCTION_NAME = 'update-kine-team-member'
const MIN_PASSWORD = 8

const ERROR_MESSAGES = {
  unauthorized: 'Je sessie is verlopen. Log opnieuw in en probeer het opnieuw.',
  forbidden: 'Je hebt geen toegang om deze gebruiker te wijzigen.',
  not_found: 'Gebruiker niet gevonden.',
  name_required: 'Vul voornaam en achternaam in.',
  invalid_birthdate: 'Vul een geldige geboortedatum in.',
  invalid_email: 'Vul een geldig e-mailadres in.',
  password_too_short: `Wachtwoord moet minstens ${MIN_PASSWORD} tekens zijn.`,
  update_failed: 'Opslaan mislukt. Probeer het later opnieuw.',
  auth_update_failed: 'Accountgegevens bijwerken mislukt.',
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
    return 'Opslaan is tijdelijk niet bereikbaar. Vernieuw de pagina en probeer opnieuw.'
  }
  return 'Opslaan mislukt. Probeer het later opnieuw.'
}

export function useUpdateKineTeamMember() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateMember = useCallback(
    async ({ kineId, firstname, lastname, dateOfBirth, email, phone, address, password }) => {
    setError(null)

    if (!kineId) {
      const message = 'Gebruiker ontbreekt.'
      setError(message)
      return { ok: false, message }
    }
    if (!String(firstname ?? '').trim() || !String(lastname ?? '').trim()) {
      const message = ERROR_MESSAGES.name_required
      setError(message)
      return { ok: false, message }
    }
    if (!String(email ?? '').trim()) {
      const message = ERROR_MESSAGES.invalid_email
      setError(message)
      return { ok: false, message }
    }
    if (password && String(password).length < MIN_PASSWORD) {
      const message = ERROR_MESSAGES.password_too_short
      setError(message)
      return { ok: false, message }
    }

    setLoading(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: {
          kineId,
          firstname: String(firstname).trim(),
          lastname: String(lastname).trim(),
          date_of_birth: dateOfBirth || null,
          email: String(email).trim(),
          phone_number: String(phone ?? '').trim() || null,
          address: String(address ?? '').trim() || null,
          password: password || '',
        },
      })

      if (invokeError) {
        const parsed = await parseFunctionsError(invokeError)
        const message = friendlyMessage(parsed.code, parsed.details ?? invokeError.message)
        setError(message)
        return { ok: false, message }
      }

      if (!data?.ok) {
        const message = friendlyMessage(
          typeof data?.error === 'string' ? data.error : null,
          data?.details
        )
        setError(message)
        return { ok: false, message }
      }

      return { ok: true }
    } catch {
      const message = 'Opslaan mislukt. Probeer het later opnieuw.'
      setError(message)
      return { ok: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateMember, loading, error, clearError: () => setError(null) }
}
