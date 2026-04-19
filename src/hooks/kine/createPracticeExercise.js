import supabase from '@/lib/supabaseClient.js'
import { categoryFromGoalId, difficultyLabelFromId } from '@/lib/kineExerciseFormConstants.js'

const BUCKET = 'exercise-videos'
const MAX_BYTES = 50 * 1024 * 1024

function sanitizeFileName(name) {
  const base = typeof name === 'string' && name.trim() ? name.trim() : 'video.mp4'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.slice(0, 120) || 'video.mp4'
}

function buildDescriptionJson({ goalId, difficultyId, repsCount, durationMinutes }) {
  const cat = categoryFromGoalId(goalId)
  const diffLabel = difficultyLabelFromId(difficultyId)
  const reps = `${repsCount}x herhalingen`
  const time = `${durationMinutes} min`
  return JSON.stringify({
    category: cat.categoryLabel,
    categoryId: cat.id,
    difficulty: diffLabel,
    reps,
    time,
  })
}

function friendlyStorageMessage(message) {
  if (!message) return 'Upload mislukt.'
  const m = message.toLowerCase()
  if (m.includes('bucket not found')) return 'Video-opslag is nog niet geconfigureerd (bucket ontbreekt).'
  if (m.includes('payload too large') || m.includes('size')) return 'Bestand is te groot (max. 50 MB op Free plan).'
  if (m.includes('mime')) return 'Dit bestandstype wordt niet geaccepteerd.'
  return 'Upload mislukt. Probeer opnieuw.'
}

/**
 * Inserts `exercises`, optionally uploads video to `exercise-videos`, updates `media_url`.
 */
export async function createPracticeExercise({
  practiceId,
  title,
  goalId,
  difficultyId,
  repsCount,
  durationMinutes,
  file,
}) {
  if (!practiceId) {
    return { ok: false, message: 'Geen praktijk gekoppeld aan je profiel.' }
  }

  const trimmed = title.trim()
  if (!trimmed) {
    return { ok: false, message: 'Vul een naam in.' }
  }

  if (file && file.size > MAX_BYTES) {
    return { ok: false, message: 'Video is te groot (max. 50 MB).' }
  }

  const description = buildDescriptionJson({
    goalId,
    difficultyId,
    repsCount,
    durationMinutes,
  })

  const { data: inserted, error: insErr } = await supabase
    .from('exercises')
    .insert({
      practice_id: practiceId,
      title: trimmed,
      description,
      media_url: null,
    })
    .select('id')
    .single()

  if (insErr || !inserted?.id) {
    return {
      ok: false,
      message: insErr?.message?.includes('row-level security')
        ? 'Geen rechten om op te slaan. Controleer je login.'
        : insErr?.message || 'Oefening opslaan mislukt.',
    }
  }

  const exerciseId = inserted.id

  if (file && file.size > 0) {
    const path = `${practiceId}/${exerciseId}/${sanitizeFileName(file.name)}`
    const contentType = file.type && file.type !== '' ? file.type : 'application/octet-stream'

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType,
      upsert: false,
    })

    if (upErr) {
      await supabase.from('exercises').delete().eq('id', exerciseId)
      return { ok: false, message: friendlyStorageMessage(upErr.message) }
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = pub?.publicUrl
    if (!publicUrl) {
      await supabase.from('exercises').delete().eq('id', exerciseId)
      return { ok: false, message: 'Kon geen URL voor de video ophalen.' }
    }

    const { error: updErr } = await supabase
      .from('exercises')
      .update({ media_url: publicUrl })
      .eq('id', exerciseId)

    if (updErr) {
      return { ok: false, message: updErr.message || 'Video-URL opslaan mislukt.' }
    }
  }

  const { data: fullRow, error: fetchErr } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .maybeSingle()

  if (fetchErr || !fullRow) {
    return { ok: true, row: { id: exerciseId, practice_id: practiceId, title: trimmed, description, media_url: null } }
  }

  return { ok: true, row: fullRow }
}
