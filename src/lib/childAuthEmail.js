/**
 * Technical Supabase Auth emails for child profiles (not real inboxes).
 * Pattern: kind.{inviteDigits}@nimbli.be (active) / kind.{inviteDigits}@pending.local (pending).
 * Each child has its own invite_code — including siblings added to the same parent.
 */

export function childAuthEmailFromInviteCode(inviteCode) {
  const digits = String(inviteCode ?? '').replace(/\D/g, '')
  return `kind.${digits || inviteCode}@nimbli.be`
}

/** @deprecated Prefer invite_code; kept for legacy rows without invite_code */
export function childAuthEmailFromProfileId(childProfileId) {
  const id = String(childProfileId ?? '').trim().toLowerCase()
  return `kind.${id}@nimbli.be`
}

export function childPendingEmailFromInviteCode(inviteCode) {
  const digits = String(inviteCode ?? '').replace(/\D/g, '')
  return `kind.${digits || inviteCode}@pending.local`
}

/** @deprecated Prefer invite_code; kept for legacy rows without invite_code */
export function childPendingEmailFromProfileId(childProfileId) {
  const id = String(childProfileId ?? '').trim().toLowerCase()
  return `kind.${id}@pending.local`
}

/** Active Auth email: invite_code when set, else profile id (legacy). */
export function childAuthEmailForChildProfile({ inviteCode, profileId }) {
  const code = String(inviteCode ?? '').trim()
  if (code) return childAuthEmailFromInviteCode(code)
  return childAuthEmailFromProfileId(profileId)
}

/** Pending profile email: invite_code when set, else profile id (legacy). */
export function childPendingEmailForChildProfile({ inviteCode, profileId }) {
  const code = String(inviteCode ?? '').trim()
  if (code) return childPendingEmailFromInviteCode(code)
  return childPendingEmailFromProfileId(profileId)
}
