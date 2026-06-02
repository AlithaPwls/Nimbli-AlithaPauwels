/** Daily mission targets (kind Overzicht / dashboard). */

export const KIND_DAILY_XP_TARGET = 150

const MISSION_DEFS = [
  { id: 'exercise', title: 'Voer één oefening uit', kind: 'exercise' },
  { id: 'xp', title: `Verdien ${KIND_DAILY_XP_TARGET} XP`, kind: 'xp' },
  { id: 'all', title: 'Voltooi al je dagmissies', kind: 'all' },
]

function missionRow({ id, title, current, total, done }) {
  return {
    id,
    title,
    current: Math.min(current, total),
    total,
    done,
    showReward: false,
  }
}

/**
 * @param {{ exercisesCompletedToday: number, xpEarnedToday: number }} input
 */
export function buildKindDailyMissions({ exercisesCompletedToday, xpEarnedToday }) {
  const exercisesDone = exercisesCompletedToday >= 1
  const xpDone = xpEarnedToday >= KIND_DAILY_XP_TARGET
  const allDone = exercisesDone && xpDone

  const exerciseCurrent = exercisesDone ? 1 : 0
  const xpCurrent = Math.min(KIND_DAILY_XP_TARGET, Math.max(0, Math.round(xpEarnedToday)))
  const allCurrent = (exercisesDone ? 1 : 0) + (xpDone ? 1 : 0) + (allDone ? 1 : 0)

  return MISSION_DEFS.map((def) => {
    if (def.kind === 'exercise') {
      return missionRow({
        id: def.id,
        title: def.title,
        current: exerciseCurrent,
        total: 1,
        done: exercisesDone,
      })
    }
    if (def.kind === 'xp') {
      return missionRow({
        id: def.id,
        title: def.title,
        current: xpCurrent,
        total: KIND_DAILY_XP_TARGET,
        done: xpDone,
      })
    }
    return missionRow({
      id: def.id,
      title: def.title,
      current: allCurrent,
      total: 3,
      done: allDone,
    })
  })
}

export const KIND_DAILY_MISSIONS_EMPTY = buildKindDailyMissions({
  exercisesCompletedToday: 0,
  xpEarnedToday: 0,
})
