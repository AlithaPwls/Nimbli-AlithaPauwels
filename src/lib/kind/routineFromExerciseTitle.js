/**
 * Maps loaded exercise title → pose routine id for `/dashboard/kind/oefening/pose`.
 * Extend when new exercises get custom pose logic.
 */
export function routineFromExerciseTitle(title) {
  if (!title || typeof title !== 'string') return null
  if (/sterren/i.test(title)) return 'stretchSterren'
  return null
}
