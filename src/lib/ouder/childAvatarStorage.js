import supabase from '@/lib/supabaseClient.js'

const BUCKET = 'profile-avatars'
const MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function extensionForFile(file) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function friendlyError(message) {
  if (!message) return 'Profielfoto opslaan mislukt.'
  const m = message.toLowerCase()
  if (m.includes('bucket not found')) {
    return 'Avatar-opslag is nog niet geconfigureerd (bucket ontbreekt).'
  }
  if (m.includes('payload too large') || m.includes('size')) {
    return 'Bestand is te groot (max. 5 MB).'
  }
  if (m.includes('row-level security') || m.includes('policy')) {
    return 'Geen rechten om deze profielfoto te wijzigen.'
  }
  return message
}

/**
 * Uploads a child profile image and updates `profiles.avatar_url`.
 * @returns {Promise<{ ok: boolean, avatarUrl?: string, message?: string }>}
 */
export async function uploadChildAvatar(childId, file) {
  if (!childId || !file) {
    return { ok: false, message: 'Geen bestand geselecteerd.' }
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, message: 'Alleen JPG, PNG of WebP is toegestaan.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: 'Bestand is te groot (max. 5 MB).' }
  }

  const ext = extensionForFile(file)
  const path = `${childId}/avatar.${ext}`

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  })

  if (upErr) {
    return { ok: false, message: friendlyError(upErr.message) }
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const baseUrl = typeof pub?.publicUrl === 'string' ? pub.publicUrl.trim() : ''
  if (!baseUrl) {
    return { ok: false, message: 'Kon geen URL voor de foto ophalen.' }
  }

  const avatarUrl = `${baseUrl}?v=${Date.now()}`

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', childId)
    .eq('role', 'child')

  if (updErr) {
    return { ok: false, message: friendlyError(updErr.message) }
  }

  return { ok: true, avatarUrl }
}

/**
 * Clears `profiles.avatar_url` and removes stored avatar files for the child.
 */
export async function removeChildAvatar(childId) {
  if (!childId) {
    return { ok: false, message: 'Geen profiel geselecteerd.' }
  }

  const paths = ['jpg', 'png', 'webp'].map((ext) => `${childId}/avatar.${ext}`)

  const { error: storageErr } = await supabase.storage.from(BUCKET).remove(paths)
  if (storageErr && !storageErr.message?.toLowerCase().includes('not found')) {
    // Non-fatal: DB clear still matters if files were already missing
  }

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', childId)
    .eq('role', 'child')

  if (updErr) {
    return { ok: false, message: friendlyError(updErr.message) }
  }

  return { ok: true, avatarUrl: null }
}
