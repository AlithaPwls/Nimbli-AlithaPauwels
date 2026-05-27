import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

const FUNCTION_NAME = 'generate-pose-config'

const ERROR_MESSAGES = {
  unauthorized: 'Je sessie is verlopen. Log opnieuw in en probeer het opnieuw.',
  invalid_payload: 'Niet alle benodigde gegevens zijn beschikbaar voor de AI.',
  invalid_json: 'Onverwacht antwoord van de server.',
  server_misconfigured: 'AI-sleutel is niet ingesteld op de server. Neem contact op met de beheerder.',
  ai_unreachable: 'De AI is even niet bereikbaar. Probeer over enkele seconden opnieuw.',
  ai_http_error: 'De AI gaf een foutmelding terug. Probeer opnieuw.',
  ai_empty_response: 'De AI gaf een leeg antwoord. Probeer opnieuw.',
  ai_invalid_json: 'De AI gaf geen geldige JSON terug. Probeer opnieuw.',
  ai_schema_invalid: 'De AI produceerde een ongeldige oefening-logica. Probeer opnieuw of pas de poses aan.',
}

function isLandmarkPayload(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    !!value.pose &&
    Array.isArray(value.pose.landmarks) &&
    value.pose.landmarks.length > 0
  )
}

function friendlyMessage(code, fallback = 'Genereren mislukt. Probeer opnieuw.') {
  if (code && Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code)) {
    return ERROR_MESSAGES[code]
  }
  return fallback
}

async function parseFunctionsError(invokeError) {
  // supabase-js wraps non-2xx in a FunctionsHttpError with a `context.response` (Response).
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

export function useGeneratePoseConfig() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const reset = useCallback(() => {
    setError(null)
    setData(null)
  }, [])

  const generate = useCallback(async (input) => {
    setError(null)

    const exerciseTitle = typeof input?.exerciseTitle === 'string' ? input.exerciseTitle.trim() : ''
    const goalId = typeof input?.goalId === 'string' ? input.goalId.trim() : ''
    const repsCount = Number(input?.repsCount)
    const rest = input?.rest
    const target = input?.target

    if (!exerciseTitle || !goalId || !Number.isFinite(repsCount) || !isLandmarkPayload(rest) || !isLandmarkPayload(target)) {
      const msg = 'Vul de oefening volledig in en leg eerst beide poses vast voor je AI-logica genereert.'
      setError(msg)
      return { ok: false, error: msg }
    }

    setLoading(true)
    try {
      const { data: respData, error: invokeError } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { exerciseTitle, goalId, repsCount, rest, target },
      })

      if (invokeError) {
        const parsed = await parseFunctionsError(invokeError)
        const msg = friendlyMessage(parsed.code)
        setError(msg)
        return { ok: false, error: msg, code: parsed.code, details: parsed.details, body: parsed.body }
      }

      const poseConfig = respData?.poseConfig
      if (!poseConfig || typeof poseConfig !== 'object') {
        const msg = friendlyMessage(null)
        setError(msg)
        return { ok: false, error: msg }
      }

      const result = {
        ok: true,
        poseConfig,
        model: respData?.model ?? null,
        usage: respData?.usage ?? null,
        retried: Boolean(respData?.retried),
      }
      setData(result)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Genereren mislukt. Probeer opnieuw.'
      setError(msg)
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  return { generate, reset, loading, error, data }
}
