/**
 * “Stretch naar de sterren”: 10 reps. Each rep = arms up → hold 5s → rest at sides →
 * short feedback → stable rest → next rep.
 * Uses Blaze pose landmark indices (same as MediaPipe PoseLandmarker).
 */
const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
}

const TARGET_REPS = 10
const VIS_MIN = 0.55
/** Normalized image coords: y grows downward — wrist must sit clearly above shoulder. */
const ARMS_UP_MIN_DELTA = 0.085
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

export function armsRaisedHigh(lm) {
  if (!lm?.length) return false
  const ls = lm[LM.LEFT_SHOULDER]
  const rs = lm[LM.RIGHT_SHOULDER]
  const lw = lm[LM.LEFT_WRIST]
  const rw = lm[LM.RIGHT_WRIST]
  if (!ls || !rs || !lw || !rw) return false
  if (!visibleEnough(lm, LM.LEFT_SHOULDER) || !visibleEnough(lm, LM.RIGHT_SHOULDER)) return false
  if (!visibleEnough(lm, LM.LEFT_WRIST) || !visibleEnough(lm, LM.RIGHT_WRIST)) return false
  const leftUp = ls.y - lw.y > ARMS_UP_MIN_DELTA
  const rightUp = rs.y - rw.y > ARMS_UP_MIN_DELTA
  return leftUp && rightUp
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
      }
    } else {
      rt.upStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down)
  }

  if (rt.phase === 'holding') {
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
      return buildUi(rt, nowMs, up, down)
    }

    return buildUi(rt, nowMs, up, down)
  }

  if (rt.phase === 'wait_arms_down') {
    if (down) {
      if (rt.downStableStartMs == null) rt.downStableStartMs = nowMs
      if (nowMs - rt.downStableStartMs >= STABLE_DOWN_MS) {
        rt.repsCompleted = (rt.repsCompleted ?? 0) + 1
        rt.downStableStartMs = null
        resetCycleTimers(rt)

        if (rt.repsCompleted >= TARGET_REPS) {
          rt.phase = 'complete'
        } else {
          rt.phase = 'between_reps'
          rt.betweenRepsUntilMs = nowMs + BETWEEN_REPS_MS
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

  if (rt.phase === 'between_reps') {
    line1 = `Rep ${done} van ${TARGET_REPS} — goed zo!`
    line2 = `Nog ${TARGET_REPS - done} herhaling${TARGET_REPS - done === 1 ? '' : 'en'} te gaan. Straks: rustpositie, daarna rep ${nextRep}.`
  } else if (rt.phase === 'wait_rest') {
    line1 = 'Rustpositie'
    line2 = `Laat je armen langs je zij hangen. Daarna: rep ${nextRep} van ${TARGET_REPS} (armen omhoog).`
  } else if (rt.phase === 'wait_arms_up') {
    line1 = 'Stretch naar de sterren'
    line2 = `Rep ${nextRep} van ${TARGET_REPS} — strek beide armen zo hoog mogelijk naar boven.`
  } else if (rt.phase === 'holding') {
    line1 = `Rep ${nextRep} van ${TARGET_REPS} — houd vol!`
    const elapsed = rt.holdStartMs != null ? Math.min(HOLD_REQUIRED_MS, Math.max(0, nowMs - rt.holdStartMs)) : 0
    progress = elapsed / HOLD_REQUIRED_MS
    const left = Math.max(0, Math.ceil((HOLD_REQUIRED_MS - elapsed) / 1000))
    line2 = left >= 1 ? `Nog ${left} s vasthouden.` : 'Bijna…'
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
    repsCompleted: done,
    repsTarget: TARGET_REPS,
    currentRep: rt.phase === 'complete' ? TARGET_REPS : nextRep,
    flags: { armsUp: up, armsDown: down },
  }
}
