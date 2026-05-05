/**
 * “Stretch naar de sterren”: 10 reps. Each rep = ellebogen + polsen boven de ogen → hold 5s → rust →
 * short feedback → stable rest → next rep.
 * Uses Blaze pose landmark indices (same as MediaPipe PoseLandmarker).
 */
import { averageScore, completeRep, createRepScoreTracker, sample, startRep } from '@/lib/kind/repScoring.js'

const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
}

/** MediaPipe pose: left/right eye inner, eye, outer (y = smallest is highest on screen). */
const EYE_INDICES = [1, 2, 3, 4, 5, 6]

const TARGET_REPS = 4
const VIS_MIN = 0.55
/** Elbows and wrists must sit this clearly above the eye reference line (smaller y). */
const ABOVE_EYES_DELTA = 0.04
/** Wrists clearly below shoulders = rustpositie. */
const ARMS_DOWN_MIN_DELTA = 0.045
/** Arms must be seen “up” for this long before the 5s hold starts (reduces jitter). */
const STABLE_UP_MS = 280
/** Brief dip while holding does not reset the timer. */
const HOLD_GRACE_MS = 450
const HOLD_REQUIRED_MS = 5000
/** Arms down must look stable before we count the rep. */
const STABLE_DOWN_MS = 350
/** After a rep: show feedback before asking for rest again. */
const BETWEEN_REPS_MS = 1600
/** Before rep 2+: arms must be clearly at rest for this long (new rep only from rust). */
const REST_STABLE_MS = 320

function visibleEnough(lm, idx) {
  const v = lm[idx]?.visibility
  return (v == null ? 1 : v) >= VIS_MIN
}

/** Hoogste zichtbare oog‑regio in beeld (kleinste y); nodig om “boven de ogen” te meten. */
function eyesReferenceY(lm) {
  let minY = Infinity
  for (const idx of EYE_INDICES) {
    const p = lm[idx]
    if (!p || !visibleEnough(lm, idx)) continue
    if (p.y < minY) minY = p.y
  }
  return Number.isFinite(minY) ? minY : null
}

/**
 * “Armen omhoog”: beide **ellebogen** en beide **polsen** duidelijk boven de **ooglijn**
 * (kleinere y dan de hoogste zichtbare oogpunten). Zonder betrouwbare ogen in beeld: geen “omhoog”.
 */
export function armsRaisedHigh(lm) {
  if (!lm?.length) return false
  const le = lm[LM.LEFT_ELBOW]
  const re = lm[LM.RIGHT_ELBOW]
  const lw = lm[LM.LEFT_WRIST]
  const rw = lm[LM.RIGHT_WRIST]
  if (!le || !re || !lw || !rw) return false
  if (!visibleEnough(lm, LM.LEFT_ELBOW) || !visibleEnough(lm, LM.RIGHT_ELBOW)) return false
  if (!visibleEnough(lm, LM.LEFT_WRIST) || !visibleEnough(lm, LM.RIGHT_WRIST)) return false

  const eyeY = eyesReferenceY(lm)
  if (eyeY == null) return false

  const above = (p) => p.y < eyeY - ABOVE_EYES_DELTA
  return above(le) && above(re) && above(lw) && above(rw)
}

export function armsDownRest(lm) {
  if (!lm?.length) return false
  const ls = lm[LM.LEFT_SHOULDER]
  const rs = lm[LM.RIGHT_SHOULDER]
  const lw = lm[LM.LEFT_WRIST]
  const rw = lm[LM.RIGHT_WRIST]
  if (!ls || !rs || !lw || !rw) return false
  if (!visibleEnough(lm, LM.LEFT_WRIST) || !visibleEnough(lm, LM.RIGHT_WRIST)) return false
  const leftDown = lw.y > ls.y + ARMS_DOWN_MIN_DELTA
  const rightDown = rw.y > rs.y + ARMS_DOWN_MIN_DELTA
  return leftDown && rightDown
}

function resetCycleTimers(rt) {
  rt.upStableStartMs = null
  rt.holdStartMs = null
  rt.lastArmsUpMs = null
  rt.downStableStartMs = null
}

/**
 * @returns {object} mutable state bag; pass same reference each frame.
 */
export function createStretchSterrenRuntime() {
  return {
    phase: 'wait_arms_up',
    repsCompleted: 0,
    lastRepScore: null,
    score: {
      tracker: createRepScoreTracker({ expectedWindowMs: HOLD_REQUIRED_MS }),
      lastNowMs: null,
    },
    upStableStartMs: null,
    holdStartMs: null,
    lastArmsUpMs: null,
    downStableStartMs: null,
    betweenRepsUntilMs: null,
    restStableStartMs: null,
  }
}

/**
 * One frame of the state machine. Mutates `rt`.
 * @param {Array<{ x: number; y: number; z?: number; visibility?: number }>} lm single pose
 * @param {number} nowMs `performance.now()`
 */
export function stepStretchSterren(rt, lm, nowMs) {
  const up = armsRaisedHigh(lm)
  const down = armsDownRest(lm)

  // Rep scoring uses dt between steps; only active during the "holding" phase.
  const prevNow = rt.score?.lastNowMs
  const dt = prevNow != null ? Math.max(0, nowMs - prevNow) : 0
  if (rt.score) rt.score.lastNowMs = nowMs

  if (rt.phase === 'between_reps') {
    if (rt.betweenRepsUntilMs != null && nowMs >= rt.betweenRepsUntilMs) {
      rt.phase = 'wait_rest'
      rt.betweenRepsUntilMs = null
      rt.restStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down)
  }

  if (rt.phase === 'wait_rest') {
    if (down) {
      if (rt.restStableStartMs == null) rt.restStableStartMs = nowMs
      if (nowMs - rt.restStableStartMs >= REST_STABLE_MS) {
        rt.phase = 'wait_arms_up'
        rt.restStableStartMs = null
        resetCycleTimers(rt)
      }
    } else {
      rt.restStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down)
  }

  if (rt.phase === 'wait_arms_up') {
    if (up) {
      if (rt.upStableStartMs == null) rt.upStableStartMs = nowMs
      if (nowMs - rt.upStableStartMs >= STABLE_UP_MS) {
        rt.phase = 'holding'
        rt.holdStartMs = nowMs
        rt.lastArmsUpMs = nowMs
        rt.upStableStartMs = null
        rt.downStableStartMs = null
        if (rt.score?.tracker) startRep(rt.score.tracker)
      }
    } else {
      rt.upStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down)
  }

  if (rt.phase === 'holding') {
    if (rt.score?.tracker) sample(rt.score.tracker, Boolean(up), dt)
    if (up) rt.lastArmsUpMs = nowMs

    if (rt.holdStartMs != null && nowMs - rt.holdStartMs >= HOLD_REQUIRED_MS) {
      rt.phase = 'wait_arms_down'
      rt.downStableStartMs = null
      rt.holdStartMs = null
      rt.lastArmsUpMs = null
      return buildUi(rt, nowMs, up, down)
    }

    const lostLongEnough = rt.lastArmsUpMs != null && nowMs - rt.lastArmsUpMs > HOLD_GRACE_MS
    if (lostLongEnough) {
      rt.phase = 'wait_arms_up'
      resetCycleTimers(rt)
      // Rep failed (didn't hold long enough): discard this rep's partial scoring window.
      if (rt.score?.tracker) startRep(rt.score.tracker)
      return buildUi(rt, nowMs, up, down)
    }

    return buildUi(rt, nowMs, up, down)
  }

  if (rt.phase === 'wait_arms_down') {
    if (down) {
      if (rt.downStableStartMs == null) rt.downStableStartMs = nowMs
      if (nowMs - rt.downStableStartMs >= STABLE_DOWN_MS) {
        rt.repsCompleted = (rt.repsCompleted ?? 0) + 1
        const repScore = rt.score?.tracker ? completeRep(rt.score.tracker) : 0
        rt.lastRepScore = repScore
        rt.downStableStartMs = null
        resetCycleTimers(rt)

        if (rt.repsCompleted >= TARGET_REPS) {
          rt.phase = 'complete'
        } else {
          rt.phase = 'between_reps'
          rt.betweenRepsUntilMs = nowMs + BETWEEN_REPS_MS
          // Prepare next rep scoring window.
          if (rt.score?.tracker) startRep(rt.score.tracker)
        }
      }
    } else {
      rt.downStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down)
  }

  return buildUi(rt, nowMs, up, down)
}

function buildUi(rt, nowMs, up, down) {
  let line1 = ''
  let line2 = ''
  let progress = 0
  const done = rt.repsCompleted ?? 0
  const nextRep = Math.min(TARGET_REPS, done + 1)

  const holdFrac =
    rt.phase === 'holding' && rt.holdStartMs != null
      ? Math.min(1, Math.max(0, nowMs - rt.holdStartMs) / HOLD_REQUIRED_MS)
      : 0
  const sessionProgress01 = Math.min(1, (done + holdFrac) / TARGET_REPS)
  const avgScore = rt.score?.tracker ? averageScore(rt.score.tracker.repScores) : 0

  if (rt.phase === 'between_reps') {
    line1 = `Rep ${done} van ${TARGET_REPS} — goed zo!`
    line2 = `Nog ${TARGET_REPS - done} herhaling${TARGET_REPS - done === 1 ? '' : 'en'} te gaan. Straks: rustpositie, daarna rep ${nextRep}.`
  } else if (rt.phase === 'wait_rest') {
    line1 = 'Rustpositie'
    line2 = `Laat je armen langs je zij hangen. Daarna: rep ${nextRep} van ${TARGET_REPS} (ellebogen en polsen boven je ogen).`
  } else if (rt.phase === 'wait_arms_up') {
    line1 = 'Stretch naar de sterren'
    line2 = `Rep ${nextRep} van ${TARGET_REPS} — strek omhoog: ellebogen én polsen boven je ogen.`
  } else if (rt.phase === 'holding') {
    line1 = `Rep ${nextRep} van ${TARGET_REPS} — houd vol!`
    const elapsed = rt.holdStartMs != null ? Math.min(HOLD_REQUIRED_MS, Math.max(0, nowMs - rt.holdStartMs)) : 0
    progress = elapsed / HOLD_REQUIRED_MS
    const left = Math.max(0, Math.ceil((HOLD_REQUIRED_MS - elapsed) / 1000))
    line2 = left >= 1 ? `Nog ${left} s — ellebogen en polsen boven je ogen houden.` : 'Bijna…'
  } else if (rt.phase === 'wait_arms_down') {
    line1 = `Rep ${nextRep} van ${TARGET_REPS}`
    line2 = 'Laat je armen rustig terug naar je zij zakken (rust voor de volgende rep).'
  } else if (rt.phase === 'complete') {
    line1 = `Alle ${TARGET_REPS} herhalingen klaar!`
    line2 = 'Super gedaan — je hebt de stretch volbracht.'
    progress = 1
  }

  return {
    phase: rt.phase,
    line1,
    line2,
    progress,
    sessionProgress01,
    averageScore: avgScore,
    lastRepScore: rt.lastRepScore,
    repsCompleted: done,
    repsTarget: TARGET_REPS,
    currentRep: rt.phase === 'complete' ? TARGET_REPS : nextRep,
    flags: { armsUp: up, armsDown: down },
  }
}
