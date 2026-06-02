import fallbackProfilePic from '@/assets/fallback-profile-pic.png'

export const FALLBACK_PROFILE_PIC = fallbackProfilePic

/** Profile photo URL, or the default child avatar when none is set. */
export function resolveProfileAvatarUrl(url) {
  const trimmed = String(url ?? '').trim()
  return trimmed || FALLBACK_PROFILE_PIC
}
