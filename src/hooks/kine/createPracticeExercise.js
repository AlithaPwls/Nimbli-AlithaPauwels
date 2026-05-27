import supabase from '@/lib/supabaseClient.js'
import { categoryFromGoalId, difficultyIdToInt } from '@/lib/kineExerciseFormConstants.js'
import { fileToJpegThumbnailBlob } from '@/lib/kine/exerciseVideoThumbnail.js'

const BUCKET = 'exercise-videos'
const MAX_BYTES = 50 * 1024 * 1024

const XP_MIN = 10
const XP_MAX = 150
const XP_STEP = 10
const XP_DEFAULT = 50

/** @param {unknown} raw */
function normalizeExerciseXpValue(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return XP_DEFAULT
  const stepped = Math.round(n / XP_STEP) * XP_STEP
  return Math.min(XP_MAX, Math.max(XP_MIN, stepped))
}

function sanitizeFileName(name) {
  const base = typeof name === 'string' && name.trim() ? name.trim() : 'video.mp4'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.slice(0, 120) || 'video.mp4'
}

function friendlyStorageMessage(message) {
  if (!message) return 'Upload mislukt.'
  const m = message.toLowerCase()
  if (m.includes('bucket not found')) return 'Video-opslag is nog niet geconfigureerd (bucket ontbreekt).'
  if (m.includes('payload too large') || m.includes('size')) return 'Bestand is te groot (max. 50 MB op Free plan).'
  if (m.includes('mime')) return 'Dit bestandstype wordt niet geaccepteerd.'
  return 'Upload mislukt. Probeer opnieuw.'
}

function hasDbPoseConfig(poseConfig) {
  return (
    poseConfig != null &&
    typeof poseConfig === 'object' &&
    !Array.isArray(poseConfig) &&
    typeof poseConfig.version === 'number'
  )
}

/**
 * Inserts `exercises`, optionally uploads video to `exercise-videos`, updates `media_url`.
 * With a video file, tries to build a JPEG thumbnail (client-side) and sets `thumbnail_url`.
 * Optional `poseConfig`: when present with numeric `version`, sets `pose_enabled` and stores JSON.
 * `xpValue` is normalized and stored as `xp_value` (10–150, steps of 10).
 */
export async function createPracticeExercise({
  practiceId,
  title,
  description,
  goalId,
  difficultyId,
  repsCount,
  durationMinutes,
  file,
  poseConfig = null,
  xpValue,
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

  const trimmedDescription =
    typeof description === 'string' && description.trim() ? description.trim() : null
  const focusId = categoryFromGoalId(goalId).id
  const difficultyInt = difficultyIdToInt(difficultyId)
  const reps = Number.isFinite(Number(repsCount)) ? Math.max(1, Math.floor(Number(repsCount))) : null
  const durationSeconds = Number.isFinite(Number(durationMinutes))
    ? Math.max(1, Math.floor(Number(durationMinutes))) * 60
    : null

  const poseEnabled = hasDbPoseConfig(poseConfig)
  const xp_value = normalizeExerciseXpValue(xpValue)

  const { data: inserted, error: insErr } = await supabase
    .from('exercises')
    .insert({
      practice_id: practiceId,
      title: trimmed,
      description: trimmedDescription,
      focus: focusId,
      difficulty: difficultyInt,
      reps,
      duration_seconds: durationSeconds,
      media_url: null,
      pose_enabled: poseEnabled,
      pose_config: poseEnabled ? poseConfig : null,
      xp_value,
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

    let thumbnailUrl = null
    try {
      const thumbBlob = await fileToJpegThumbnailBlob(file)
      const thumbPath = `${practiceId}/${exerciseId}/thumbnail.jpg`
      const { error: thumbUpErr } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      })
      if (!thumbUpErr) {
        const { data: thumbPub } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath)
        thumbnailUrl = typeof thumbPub?.publicUrl === 'string' ? thumbPub.publicUrl : null
      }
    } catch {
      // Exercise still valid without thumbnail
    }

    const mediaPatch = { media_url: publicUrl }
    if (thumbnailUrl) {
      mediaPatch.thumbnail_url = thumbnailUrl
    }

    const { error: updErr } = await supabase
      .from('exercises')
      .update(mediaPatch)
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
    return {
      ok: true,
      row: {
        id: exerciseId,
        practice_id: practiceId,
        title: trimmed,
        description: trimmedDescription,
        focus: focusId,
        difficulty: difficultyInt,
        reps,
        duration_seconds: durationSeconds,
        media_url: null,
        pose_enabled: poseEnabled,
        pose_config: poseEnabled ? poseConfig : null,
        xp_value,
      },
    }
  }

  return { ok: true, row: fullRow }
}
