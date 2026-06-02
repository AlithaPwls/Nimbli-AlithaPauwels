/** Parse `yyyy-MM-dd` as local calendar date (no UTC shift). */
export function parseIsoDateLocal(iso) {
  if (!iso) return undefined
  const s = String(iso).trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return undefined
  return date
}

/** Format Date to `yyyy-MM-dd` for storage / native date inputs. */
export function toIsoDateLocal(date) {
  if (!date || Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatDateNlShort(date) {
  if (!date || Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
