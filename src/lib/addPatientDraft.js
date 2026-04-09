const STORAGE_KEY = 'nimbli.addPatientDraft.v1'

export function readAddPatientDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function writeAddPatientDraft(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function updateAddPatientDraft(patch) {
  const prev = readAddPatientDraft() ?? {}
  const next = { ...prev, ...patch, updatedAt: Date.now() }
  writeAddPatientDraft(next)
  return next
}

export function clearAddPatientDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

