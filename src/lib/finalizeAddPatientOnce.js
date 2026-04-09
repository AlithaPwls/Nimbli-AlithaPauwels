/**
 * Returns one shared promise per wizard draft so React 18 Strict Mode (dev) cannot
 * fire two finalizes: effects unmount/remount while the same draft is still in localStorage.
 */
let entry = null

function draftKey(draft) {
  if (!draft || typeof draft !== 'object') return ''
  return [
    draft.updatedAt,
    draft.parentEmail,
    draft.childFirstname,
    draft.childLastname,
    draft.parentFirstname,
    draft.parentLastname,
    draft.childDob,
  ].join('|')
}

export function runFinalizeAddPatientOnce(finalizeFn, draft) {
  const key = draftKey(draft)
  if (entry?.key === key) {
    return entry.promise
  }
  const promise = finalizeFn(draft)
  entry = { key, promise }
  return promise
}
