const PART_LABELS = {
  NOSE: 'neus',
  EYE_INNER: 'oog',
  EYE: 'oog',
  EYE_OUTER: 'oog',
  EAR: 'oor',
  MOUTH_LEFT: 'mond',
  MOUTH_RIGHT: 'mond',
  SHOULDER: 'schouder',
  ELBOW: 'elleboog',
  WRIST: 'pols',
  PINKY: 'pink',
  INDEX: 'wijsvinger',
  THUMB: 'duim',
  HIP: 'heup',
  KNEE: 'knie',
  ANKLE: 'enkel',
  HEEL: 'hiel',
  FOOT_INDEX: 'voet',
}

function partLabelFromToken(token) {
  if (!token) return null
  if (PART_LABELS[token]) return PART_LABELS[token]
  for (const [key, label] of Object.entries(PART_LABELS)) {
    if (token.endsWith(`_${key}`) || token === key) return label
  }
  return null
}

/**
 * MediaPipe landmark id → korte Nederlandse omschrijving (bijv. "rechter elleboog").
 * @param {string} name
 */
export function landmarkNameToDutchLabel(name) {
  if (!name || typeof name !== 'string') return null
  const upper = name.trim().toUpperCase()
  if (!upper || upper.startsWith('INDEX_')) return null

  let side = ''
  let rest = upper
  if (rest.startsWith('LEFT_')) {
    side = 'linker'
    rest = rest.slice(5)
  } else if (rest.startsWith('RIGHT_')) {
    side = 'rechter'
    rest = rest.slice(6)
  }

  const part = partLabelFromToken(rest)
  if (!part) return null
  if (!side) return part
  if (part === 'oog' || part === 'oor') return `${side}${part}`
  return `${side} ${part}`
}

/**
 * @param {string[]} names
 * @param {number} [maxItems=5]
 */
export function formatBodyPartsList(names, maxItems = 5) {
  const labels = [...new Set(names.map(landmarkNameToDutchLabel).filter(Boolean))]
  if (labels.length === 0) return null
  if (labels.length <= maxItems) return labels.join(', ')
  const shown = labels.slice(0, maxItems - 1)
  const rest = labels.length - shown.length
  return `${shown.join(', ')} en ${rest} andere plekken`
}

/**
 * @param {string} slotLabel bijv. "Rustpositie"
 * @param {string} timeLabel bijv. "0:03"
 * @param {{ visibleCount: number, totalPoints: number }|null} summary
 */
export function formatCaptureSuccessMessage(slotLabel, timeLabel, summary) {
  const base = `${slotLabel} vastgelegd op ${timeLabel}. De houding is herkend.`
  if (!summary || summary.totalPoints <= 0) return base

  const ratio = summary.visibleCount / summary.totalPoints
  if (ratio >= 0.85) {
    return `${base} Het lichaam is goed zichtbaar in beeld.`
  }
  if (ratio >= 0.7) {
    return `${base} Het meeste van het lichaam is zichtbaar.`
  }
  return base
}

/**
 * @param {{ visibleCount: number, totalPoints: number, lowVisibilityNames: string[] }} summary
 */
export function formatLowVisibilityWarning(summary) {
  const parts = formatBodyPartsList(summary.lowVisibilityNames, 5)
  const lines = [
    'Niet alles is goed zichtbaar in dit beeld. Kies een ander moment in de video of pas de opname aan: zet de persoon volledig in beeld, gebruik voldoende licht en zorg dat armen en benen niet uit beeld vallen.',
  ]
  if (parts) {
    lines.push(`Vooral moeilijk te zien: ${parts}.`)
  }
  return lines.join(' ')
}
