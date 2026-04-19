import { normalizeExerciseRow } from '@/lib/exerciseDisplay.js'
import { GOAL_OPTIONS, GOAL_TAG } from '@/lib/kineExerciseFormConstants.js'

/** True when `media_url` points to a practice-uploaded video (eigen video's tab). */
export function rowHasUploadedVideoFile(row) {
  const m = typeof row?.media_url === 'string' ? row.media_url.trim() : ''
  if (!m) return false
  const path = (m.split('?')[0] || m).toLowerCase()
  if (path.includes('/exercise-videos/')) return true
  return /\.(mp4|mov|avi|webm|m4v)$/i.test(path)
}

function tryParseMeta(description) {
  if (!description || typeof description !== 'string') return null
  const t = description.trim()
  if (!t.startsWith('{')) return null
  try {
    const o = JSON.parse(t)
    return o && typeof o === 'object' ? o : null
  } catch {
    return null
  }
}

/**
 * Map a Supabase `exercises` row to the card shape used on KineOefeningenEigenVideos.
 */
export function dbExerciseRowToEigenVideoCard(row) {
  const n = normalizeExerciseRow(row)
  const meta = tryParseMeta(row.description)

  let categoryId = 'mobiliteit'
  if (meta?.categoryId && ['balans', 'mobiliteit', 'kracht'].includes(meta.categoryId)) {
    categoryId = meta.categoryId
  } else {
    const c = String(n.category || '').toLowerCase()
    if (c.includes('balans')) categoryId = 'balans'
    else if (c.includes('kracht')) categoryId = 'kracht'
    else if (c.includes('mobiliteit')) categoryId = 'mobiliteit'
  }

  const categoryLabel =
    meta?.category?.trim() ||
    GOAL_OPTIONS.find((o) => o.id === categoryId)?.label ||
    n.category ||
    'Mobiliteit'

  const tagClass = GOAL_TAG[categoryId] ?? 'bg-[#FBB92A]'

  const media = [row.media_url, row.image_url, row.thumbnail_url].find(
    (u) => typeof u === 'string' && u.trim()
  )
  const mediaTrim = typeof media === 'string' ? media.trim() : ''
  const looksVideo = /\.(mp4|mov|avi|webm|m4v)$/i.test(mediaTrim)

  return {
    id: row.id,
    title: n.title,
    category: categoryId,
    categoryLabel,
    tagClass,
    difficulty: n.difficulty,
    reps: n.reps,
    duration: n.time,
    thumb: n.imageUrl,
    videoUrl: looksVideo ? mediaTrim : undefined,
  }
}
