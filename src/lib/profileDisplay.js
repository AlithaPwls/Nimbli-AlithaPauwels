export function profileInitials(firstname, lastname) {
  const f = String(firstname ?? '').trim()
  const l = String(lastname ?? '').trim()
  const a = f ? f[0] : ''
  const b = l ? l[0] : ''
  return (a + b).toUpperCase() || 'K'
}

export function profileFullName(firstname, lastname, fallback = 'Kind') {
  const name = `${firstname ?? ''} ${lastname ?? ''}`.trim()
  return name || fallback
}

export function formatProfileBirthDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function profileAgeLabel(iso) {
  if (!iso) return null
  const born = new Date(iso)
  if (Number.isNaN(born.getTime())) return null
  const today = new Date()
  let years = today.getFullYear() - born.getFullYear()
  const monthDiff = today.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    years -= 1
  }
  if (years < 0 || years > 120) return null
  return years === 1 ? '1 jaar' : `${years} jaar`
}
