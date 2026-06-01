import supabase from '@/lib/supabaseClient.js'

const BUCKET = 'exercise-videos'

function storagePathFromPublicUrl(url) {
  if (!url || typeof url !== 'string') return null
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const path = url.slice(idx + marker.length).split('?')[0]
  return path?.trim() ? path : null
}

function collectStoragePaths(row) {
  const paths = new Set()
  for (const key of ['media_url', 'thumbnail_url', 'image_url', 'video_url']) {
    const p = storagePathFromPublicUrl(row?.[key])
    if (p) paths.add(p)
  }
  return [...paths]
}

async function removeExerciseStorageFiles(row) {
  const paths = collectStoragePaths(row)
  const prefix =
    row?.practice_id && row?.id ? `${row.practice_id}/${row.id}` : null

  if (prefix) {
    const { data: listed } = await supabase.storage.from(BUCKET).list(prefix)
    for (const file of listed ?? []) {
      if (file?.name) paths.push(`${prefix}/${file.name}`)
    }
  }

  const unique = [...new Set(paths)]
  if (unique.length === 0) return

  await supabase.storage.from(BUCKET).remove(unique)
}

/**
 * Deletes a practice-owned exercise row and best-effort storage objects.
 */
export async function deletePracticeExercise({ exerciseId, practiceId, rawRow }) {
  if (!exerciseId || !practiceId) {
    return { ok: false, message: 'Oefening niet gevonden.' }
  }

  const { error: delErr } = await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId)
    .eq('practice_id', practiceId)

  if (delErr) {
    const msg = delErr.message?.toLowerCase() ?? ''
    if (msg.includes('row-level security') || msg.includes('permission')) {
      return { ok: false, message: 'Geen rechten om deze oefening te verwijderen.' }
    }
    if (msg.includes('foreign key') || msg.includes('violates')) {
      return {
        ok: false,
        message:
          'Deze oefening kan niet worden verwijderd omdat er nog gekoppelde gegevens zijn.',
      }
    }
    return { ok: false, message: delErr.message || 'Verwijderen mislukt. Probeer opnieuw.' }
  }

  try {
    await removeExerciseStorageFiles(rawRow ?? {})
  } catch {
    // Row is gone; orphaned storage is acceptable.
  }

  return { ok: true }
}
