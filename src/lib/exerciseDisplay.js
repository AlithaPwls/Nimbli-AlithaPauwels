const PLACEHOLDER_IMG =
  'https://placehold.co/96x96/faf5ee/6b7280/png?text=%E2%80%A2&font=raleway'

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

  const imageUrl =
    [row.media_url, row.image_url, row.thumbnail_url].find((u) => typeof u === 'string' && u.trim())?.trim() ||
    PLACEHOLDER_IMG

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
    description: row.description,
  }
}
