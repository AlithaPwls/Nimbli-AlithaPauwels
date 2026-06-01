export async function parseFunctionsError(invokeError) {
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
