export function toDateInputValue(dateOfBirth) {
  if (!dateOfBirth) return ''
  const isoDate = String(dateOfBirth).trim().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate
  const d = new Date(dateOfBirth)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function memberToForm(member) {
  return {
    firstname: member?.firstname?.trim() ?? '',
    lastname: member?.lastname?.trim() ?? '',
    email: member?.email?.trim() ?? '',
    dateOfBirth: toDateInputValue(member?.dateOfBirth),
    password: '',
  }
}
