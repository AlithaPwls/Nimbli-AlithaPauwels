export const EXERCISE_PLACEHOLDER_IMG =
  'https://placehold.co/96x96/faf5ee/6b7280/png?text=%E2%80%A2&font=raleway'

/** PostgREST select for list/card views that need thumbnails. */
export const EXERCISE_THUMBNAIL_SELECT =
  'id, title, name, description, media_url, thumbnail_url, video_url, focus, duration_seconds'

const PLACEHOLDER_IMG = EXERCISE_PLACEHOLDER_IMG

function isProbablyImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  const u = url.trim().toLowerCase()
  if (!u) return false
  if (u.startsWith('data:image/')) return true
  // Quick blocklist for common video providers / formats used in this project.
  if (u.includes('youtu.be') || u.includes('youtube.com')) return false
  if (u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov')) return false
  return true
}

function youtubeThumb(url) {
  const id = youtubeVideoId(url)
  if (!id) return null
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/** YouTube watch/share URL → video id, or null. */
export function youtubeVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const t = url.trim()
  const m1 = t.match(/youtu\.be\/([^?&/]+)/)
  const m2 = t.match(/[?&]v=([^&]+)/)
  const id = (m1?.[1] || m2?.[1] || '').trim()
  return id || null
}

export function youtubeEmbedUrl(url) {
  const id = youtubeVideoId(url)
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

/** Direct file / storage / provider URL usable in `<video src>`. */
export function isExerciseVideoFileUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (youtubeVideoId(url)) return false
  const path = (url.split('?')[0] || url).toLowerCase()
  if (path.includes('/exercise-videos/')) return true
  return /\.(mp4|mov|avi|webm|m4v)$/i.test(path)
}

export function isExerciseVideoUrl(url) {
  return Boolean(youtubeVideoId(url) || isExerciseVideoFileUrl(url))
}

function tryParseDescriptionMeta(description) {
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
 * Human-readable copy for detail views (never raw JSON).
 */
export function exerciseDescriptionForDialog(rawDescription) {
  const meta = tryParseDescriptionMeta(rawDescription)
  if (meta) {
    const blocks = []
    for (const key of ['instructions', 'notes', 'description', 'tips']) {
      const v = meta[key]
      if (typeof v === 'string' && v.trim()) blocks.push(v.trim())
    }
    return blocks.join('\n\n')
  }
  if (!rawDescription || typeof rawDescription !== 'string') return ''
  const t = rawDescription.trim()
  if (t.startsWith('{')) return ''
  return t
}

function inferCategoryTone(category) {
  const c = String(category || '').toLowerCase()
  if (c.includes('mobiliteit')) return 'yellow'
  if (c.includes('kracht')) return 'purple'
  if (c.includes('balans')) return 'green'
  return 'default'
}

export function categoryToneClasses(tone) {
  switch (tone) {
    case 'yellow':
      return 'bg-[#FBB92A] text-[#302d2d]'
    case 'green':
      return 'bg-[#BDE786] text-[#302d2d]'
    case 'purple':
      return 'bg-[#E9B5FF] text-[#302d2d]'
    default:
      return 'bg-nimbli/15 text-nimbli-ink'
  }
}

function strCell(value) {
  if (value == null) return ''
  const s = typeof value === 'string' ? value : String(value)
  return s.trim()
}

const STAR = '\u2605'

/**
 * Numeric difficulty (1–10) → filled stars; otherwise keeps text (e.g. "Makkelijk").
 */
export function formatExerciseDifficulty(raw) {
  if (raw == null || raw === '') return '—'

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.floor(raw)
    if (n >= 1 && n <= 10) return STAR.repeat(n)
    return '—'
  }

  const s = String(raw).trim()
  if (s === '') return '—'
  if (/^\d+(\.0+)?$/.test(s)) {
    const n = Math.floor(Number(s))
    if (n >= 1 && n <= 10) return STAR.repeat(n)
    return '—'
  }

  return s
}

/**
 * Map a Supabase `exercises` row to UI fields.
 * Primary category label for chips + filters: `focus` (then `category`, then JSON meta).
 * Optional: difficulty, reps; `duration_seconds` (shown as minutes, rounded up); legacy `duration_minutes`; JSON in `description`.
 */
export function normalizeExerciseRow(row) {
  const meta = tryParseDescriptionMeta(row.description)

  const category =
    strCell(row.focus) || strCell(row.category) || strCell(meta?.category) || 'Bibliotheek'

  const difficulty = formatExerciseDifficulty(row.difficulty ?? meta?.difficulty)

  let reps = row.reps ?? meta?.reps ?? '—'
  if (reps === '—' && row.description && !meta) {
    const line = String(row.description).split('\n')[0]?.trim()
    if (line && line.length < 80) reps = line
  }

  let time = '—'
  const secRaw = row.duration_seconds
  if (secRaw != null && Number.isFinite(Number(secRaw))) {
    const sec = Math.max(0, Number(secRaw))
    time = `${Math.ceil(sec / 60)} min`
  } else if (row.duration_minutes != null && Number.isFinite(Number(row.duration_minutes))) {
    time = `${Math.ceil(Number(row.duration_minutes))} min`
  } else if (meta?.time) {
    time = meta.time
  }

  const thumbCandidates = [
    row.thumbnail_url,
    row.image_url,
    meta?.thumbnail_url,
    meta?.thumbnailUrl,
    meta?.image_url,
    meta?.imageUrl,
  ]
  const thumb =
    thumbCandidates.find((u) => typeof u === 'string' && u.trim())?.trim() || null

  const mediaCandidates = [row.media_url, row.video_url, meta?.media_url, meta?.video_url]
    .filter((u) => typeof u === 'string' && u.trim())
    .map((u) => u.trim())

  const yt =
    mediaCandidates.map((url) => youtubeThumb(url)).find(Boolean) || null

  const imageFromMedia = mediaCandidates.find((url) => isProbablyImageUrl(url)) || null

  const thumbnailUrl =
    (thumb && isProbablyImageUrl(thumb) ? thumb : null) || yt || imageFromMedia || null

  const imageUrl = thumbnailUrl || PLACEHOLDER_IMG

  const youtubeUrl = mediaCandidates.find((url) => youtubeVideoId(url)) || null
  const videoUrl =
    mediaCandidates.find((url) => isExerciseVideoFileUrl(url)) ||
    (isExerciseVideoFileUrl(thumb) ? thumb : null) ||
    null

  const tone = inferCategoryTone(category)

  const titleRaw = row.title ?? row.name
  const title = (typeof titleRaw === 'string' ? titleRaw : titleRaw != null ? String(titleRaw) : '').trim() || 'Oefening'

  return {
    id: row.id,
    title,
    category,
    categoryTone: tone,
    difficulty,
    reps,
    time,
    imageUrl,
    thumbnailUrl,
    videoUrl,
    youtubeUrl,
    description: row.description,
    mediaUrl: videoUrl ?? youtubeUrl ?? mediaCandidates[0] ?? null,
  }
}
