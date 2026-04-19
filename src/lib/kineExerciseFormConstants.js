export const GOAL_OPTIONS = [
  { id: 'balans', label: 'Balans' },
  { id: 'mobiliteit', label: 'Mobiliteit' },
  { id: 'kracht', label: 'Kracht' },
]

export const GOAL_TAG = {
  balans: 'bg-[#BDE786]',
  mobiliteit: 'bg-[#FBB92A]',
  kracht: 'bg-[#ffc1f9]',
}

export const DIFFICULTY_OPTIONS = [
  { id: 'makkelijk', label: 'Makkelijk' },
  { id: 'gemiddeld', label: 'Gemiddeld' },
  { id: 'moeilijk', label: 'Moeilijk' },
]

export function categoryFromGoalId(goalId) {
  const id = GOAL_OPTIONS.some((o) => o.id === goalId) ? goalId : 'mobiliteit'
  const label = GOAL_OPTIONS.find((o) => o.id === id)?.label ?? 'Mobiliteit'
  return { id, tagClass: GOAL_TAG[id] ?? 'bg-[#FBB92A]', categoryLabel: label }
}

export function difficultyLabelFromId(difficultyId) {
  return DIFFICULTY_OPTIONS.find((o) => o.id === difficultyId)?.label ?? 'Gemiddeld'
}
