import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

const FUNCTION_NAME = 'invite-kine-team-member'
const MIN_PASSWORD = 8

const ERROR_MESSAGES = {
  unauthorized: 'Je sessie is verlopen. Log opnieuw in en probeer het opnieuw.',
  forbidden: 'Je hebt geen toegang om teamleden toe te voegen.',
  invalid_payload: 'Controleer de ingevulde gegevens.',
  invalid_json: 'Onverwacht antwoord van de server.',
  server_misconfigured: 'Toevoegen is niet geconfigureerd op de server.',
  name_required: 'Vul voornaam en achternaam in.',
  invalid_birthdate: 'Vul een geldige geboortedatum in.',
  invalid_email: 'Vul een geldig e-mailadres in.',
  password_too_short: `Wachtwoord moet minstens ${MIN_PASSWORD} tekens zijn.`,
  auth_create_failed: 'Account aanmaken mislukt.',
  profile_create_failed: 'Profiel aanmaken mislukt. Probeer het later opnieuw.',
  method_not_allowed: 'Toevoegen mislukt. Probeer het later opnieuw.',
}

async function parseFunctionsError(invokeError) {
  const response = invokeError?.context?.response
  if (response && typeof response.json === 'function') {
    try {
      const body = await response.json()
      return {
        code: typeof body?.error === 'string' ? body.error : null,
        details: typeof body?.details === 'string' ? body.details : null,
        status: response.status ?? null,
      }
    } catch {
      return { code: null, details: invokeError?.message ?? null, status: null }
    }
  }
  return { code: null, details: invokeError?.message ?? null, status: null }
}

function friendlyMessage(code, details, status) {
  if (code === 'auth_create_failed') {
    const raw = `${details ?? ''}`.toLowerCase()
    if (
      status === 409 ||
      raw.includes('already') ||
      raw.includes('registered') ||
      raw.includes('exists') ||
      raw.includes('duplicate')
    ) {
      return 'Dit e-mailadres is al geregistreerd.'
    }
  }
  if (code && Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code)) {
    return ERROR_MESSAGES[code]
  }
  return 'Gebruiker toevoegen mislukt. Probeer het later opnieuw.'
}

export function useInviteKineTeamMember() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const invite = useCallback(async ({ firstname, lastname, dateOfBirth, email, password, repeatPassword }) => {
    setError(null)

    if (!String(firstname ?? '').trim() || !String(lastname ?? '').trim()) {
      const message = 'Vul voornaam en achternaam in.'
      setError(message)
      return { ok: false, message }
    }
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth))) {
      const message = 'Vul een geldige geboortedatum in.'
      setError(message)
      return { ok: false, message }
    }
    if (!String(email ?? '').trim()) {
      const message = 'Vul een e-mailadres in.'
      setError(message)
      return { ok: false, message }
    }
    if (String(password ?? '').length < MIN_PASSWORD) {
      const message = `Wachtwoord moet minstens ${MIN_PASSWORD} tekens zijn.`
      setError(message)
      return { ok: false, message }
    }
    if (password !== repeatPassword) {
      const message = 'Wachtwoorden komen niet overeen.'
      setError(message)
      return { ok: false, message }
    }

    setLoading(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: {
          kine: {
            firstname: String(firstname).trim(),
            lastname: String(lastname).trim(),
            date_of_birth: dateOfBirth || null,
            email: String(email).trim(),
            password,
          },
        },
      })

      if (invokeError) {
        const parsed = await parseFunctionsError(invokeError)
        const message = friendlyMessage(parsed.code, parsed.details, parsed.status)
        setError(message)
        return { ok: false, message }
      }

      if (!data?.ok) {
        const message = friendlyMessage(data?.error, data?.details, null)
        setError(message)
        return { ok: false, message }
      }

      return { ok: true }
    } finally {
      setLoading(false)
    }
  }, [])

  return { invite, loading, error, setError }
}
