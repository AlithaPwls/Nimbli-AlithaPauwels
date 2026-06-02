const INVITE_CODE_LENGTH = 6

export function normalizeInviteCodeDigits(code) {
  return String(code ?? '').replace(/\D/g, '').slice(0, INVITE_CODE_LENGTH)
}

/** Public registration URL encoded in invite QR codes. */
export function buildInviteRegisterUrl(inviteCode, baseOrigin) {
  const digits = normalizeInviteCodeDigits(inviteCode)
  if (digits.length !== INVITE_CODE_LENGTH) return null

  const origin =
    baseOrigin ??
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '')

  if (!origin) return `/register?code=${digits}`
  return `${origin.replace(/\/$/, '')}/register?code=${digits}`
}

export function formatInviteCodeDisplay(code) {
  const digits = normalizeInviteCodeDigits(code)
  if (digits.length !== INVITE_CODE_LENGTH) return digits || '—'
  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}
