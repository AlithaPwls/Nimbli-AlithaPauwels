/**
 * Generic rep scoring helper for pose-based exercises.
 *
 * Model:
 * - Each rep has a “scoring window” (e.g. during a hold).
 * - On each frame, call `sample(isCorrect, dtMs)` to accumulate time.
 * - When the rep ends, call `completeRep()` → stores a 0–100 score.
 */

function clamp01(n) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function clampInt0to100(n) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function createRepScoreTracker({ expectedWindowMs }) {
  const expected = Number(expectedWindowMs)
  const expectedSafe = Number.isFinite(expected) && expected > 0 ? expected : 1000

  return {
    expectedWindowMs: expectedSafe,
    repScores: [],
    currentTotalMs: 0,
    currentCorrectMs: 0,
  }
}

export function startRep(tracker) {
  tracker.currentTotalMs = 0
  tracker.currentCorrectMs = 0
}

export function sample(tracker, isCorrect, dtMs) {
  const dt = Number(dtMs)
  if (!Number.isFinite(dt) || dt <= 0) return
  tracker.currentTotalMs += dt
  if (isCorrect) tracker.currentCorrectMs += dt
}

export function completeRep(tracker) {
  // Normalize to the expected scoring window so reps are comparable.
  const frac = clamp01(tracker.currentCorrectMs / tracker.expectedWindowMs)
  const score = clampInt0to100(frac * 100)
  tracker.repScores.push(score)
  tracker.currentTotalMs = 0
  tracker.currentCorrectMs = 0
  return score
}

export function averageScore(repScores) {
  const arr = Array.isArray(repScores) ? repScores : []
  if (arr.length === 0) return 0
  const sum = arr.reduce((acc, v) => acc + (Number.isFinite(Number(v)) ? Number(v) : 0), 0)
  return clampInt0to100(sum / arr.length)
}

