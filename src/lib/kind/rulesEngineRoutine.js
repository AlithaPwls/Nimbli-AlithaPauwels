/**
 * Generic multi-rep hold routine driven by `poseRulesEngine` + `pose_config.copy`.
 * State phases mirror stretch so `PoseDetection.jsx` can reuse the same overlay shape.
 *
 * @example Voorbeeld `exercises.pose_config` (JSON in Supabase). `version` is verplicht als `pose_enabled=true`.
 * “Hoog” t.o.v. ogen: gebruik `aboveEyeLine` (zelfde idee als de oude stretch-ooglijn). Zie `poseRulesEngine.js`.
 *
 * ```json
 * {
 *   "version": 1,
 *   "type": "rules_engine_v1",
 *   "thresholds": { "visMin": 0.55, "deltaY": 0.04, "aboveEyesDelta": 0.04 },
 *   "timing": {
 *     "stableUpMs": 280,
 *     "holdGraceMs": 450,
 *     "holdRequiredMs": 2000,
 *     "stableDownMs": 350,
 *     "betweenRepsMs": 1600,
 *     "restStableMs": 320
 *   },
 *   "rules": {
 *     "up": [
 *       { "op": "visible", "points": ["LEFT_ELBOW", "RIGHT_ELBOW", "LEFT_WRIST", "RIGHT_WRIST"] },
 *       { "op": "aboveEyeLine", "a": "LEFT_ELBOW" },
 *       { "op": "aboveEyeLine", "a": "RIGHT_ELBOW" },
 *       { "op": "aboveEyeLine", "a": "LEFT_WRIST" },
 *       { "op": "aboveEyeLine", "a": "RIGHT_WRIST" }
 *     ],
 *     "rest": [
 *       { "op": "below", "a": "LEFT_WRIST", "b": "LEFT_SHOULDER", "delta": 0.045 },
 *       { "op": "below", "a": "RIGHT_WRIST", "b": "RIGHT_SHOULDER", "delta": 0.045 }
 *     ]
 *   },
 *   "copy": { "waitUp": { "line1": "", "line2": "" } }
 * }
 * ```
 *
 * Placeholders in `copy.*.line1` / `line2`: `{nextRep}`, `{repsTarget}`, `{done}`, `{remaining}`, `{secondsLeft}`.
 * Laat `rules.rest` weg om de ingebouwde default (polsen onder schouders) te gebruiken.
 */
import { averageScore, completeRep, createRepScoreTracker, sample, startRep } from '@/lib/kind/repScoring.js'
import { evaluateRuleSet, evaluateRulesUp } from '@/lib/kind/poseRulesEngine.js'

export const RULES_ENGINE_POSE_TYPE = 'rules_engine_v1'

const DEFAULT_TARGET_REPS = 10
const STABLE_UP_MS = 280
const HOLD_GRACE_MS = 450
const HOLD_REQUIRED_MS = 2000
const STABLE_DOWN_MS = 350
const BETWEEN_REPS_MS = 1600
const REST_STABLE_MS = 320

/** When `rules.rest` is omitted, wrists clearly below shoulders (same idea as stretch rust). */
const DEFAULT_REST_RULES = [
  { op: 'below', a: 'LEFT_WRIST', b: 'LEFT_SHOULDER', delta: 0.045 },
  { op: 'below', a: 'RIGHT_WRIST', b: 'RIGHT_SHOULDER', delta: 0.045 },
]

function num(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function normalizeTargetReps(raw) {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_TARGET_REPS
  return Math.max(1, Math.min(50, Math.round(n)))
}

/**
 * @param {object|null|undefined} poseConfig
 */
export function resolveRulesRoutineTiming(poseConfig) {
  const timing = poseConfig?.timing && typeof poseConfig.timing === 'object' ? poseConfig.timing : {}
  return {
    stableUpMs: num(timing.stableUpMs, STABLE_UP_MS),
    holdGraceMs: num(timing.holdGraceMs, HOLD_GRACE_MS),
    holdRequiredMs: num(timing.holdRequiredMs, HOLD_REQUIRED_MS),
    stableDownMs: num(timing.stableDownMs, STABLE_DOWN_MS),
    betweenRepsMs: num(timing.betweenRepsMs, BETWEEN_REPS_MS),
    restStableMs: num(timing.restStableMs, REST_STABLE_MS),
  }
}

/**
 * @param {object|null|undefined} poseConfig
 * @returns {object[]|object}
 */
function getEffectiveRestRules(poseConfig) {
  const r = poseConfig?.rules?.rest
  if (Array.isArray(r) && r.length > 0) return r
  if (r && typeof r === 'object' && !Array.isArray(r)) return r
  return DEFAULT_REST_RULES
}

function evaluateDown(lm, poseConfig) {
  return evaluateRuleSet(lm, getEffectiveRestRules(poseConfig), poseConfig)
}

function evaluateUp(lm, poseConfig) {
  return evaluateRulesUp(lm, poseConfig)
}

function resetCycleTimers(rt) {
  rt.upStableStartMs = null
  rt.holdStartMs = null
  rt.lastUpMs = null
  rt.downStableStartMs = null
}

/**
 * @param {Record<string, string|number>} vars
 */
function applyCopyTemplate(s, vars) {
  if (typeof s !== 'string' || !s) return ''
  return s.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key]
    return v != null ? String(v) : ''
  })
}

/**
 * @param {object|undefined} block `{ line1, line2 }`
 */
function linesFromCopy(block, vars, fallback1, fallback2) {
  const line1 = applyCopyTemplate(typeof block?.line1 === 'string' ? block.line1 : '', vars) || fallback1
  const line2 = applyCopyTemplate(typeof block?.line2 === 'string' ? block.line2 : '', vars) || fallback2
  return { line1, line2 }
}

function buildUi(rt, nowMs, up, down, poseConfig) {
  const timing = resolveRulesRoutineTiming(poseConfig)
  const holdRequired = timing.holdRequiredMs
  const copyRoot = poseConfig?.copy && typeof poseConfig.copy === 'object' ? poseConfig.copy : {}

  let line1 = ''
  let line2 = ''
  let progress = 0
  const done = rt.repsCompleted ?? 0
  const repsTarget = rt.repsTarget ?? DEFAULT_TARGET_REPS
  const nextRep = Math.min(repsTarget, done + 1)
  const remaining = Math.max(0, repsTarget - done)

  const holdFrac =
    rt.phase === 'holding' && rt.holdStartMs != null
      ? Math.min(1, Math.max(0, nowMs - rt.holdStartMs) / holdRequired)
      : 0
  const sessionProgress01 = Math.min(1, (done + holdFrac) / repsTarget)
  const avgScore = rt.score?.tracker ? averageScore(rt.score.tracker.repScores) : 0
  const score01 = Math.max(0, Math.min(1, (typeof avgScore === 'number' ? avgScore : 0) / 100))

  const elapsedHold =
    rt.phase === 'holding' && rt.holdStartMs != null ? Math.min(holdRequired, Math.max(0, nowMs - rt.holdStartMs)) : 0
  const secondsLeft = Math.max(0, Math.ceil((holdRequired - elapsedHold) / 1000))

  const vars = {
    nextRep,
    repsTarget,
    done,
    remaining,
    secondsLeft,
  }

  if (rt.phase === 'between_reps') {
    ;({ line1, line2 } = linesFromCopy(
      copyRoot.betweenReps,
      vars,
      `Rep ${done} van ${repsTarget} — goed zo!`,
      `Nog ${remaining} herhaling${remaining === 1 ? '' : 'en'}. Straks: rust, daarna rep ${nextRep}.`
    ))
  } else if (rt.phase === 'wait_rest') {
    ;({ line1, line2 } = linesFromCopy(
      copyRoot.waitRest,
      vars,
      'Rustpositie',
      `Neem rust. Daarna: rep ${nextRep} van ${repsTarget}.`
    ))
  } else if (rt.phase === 'wait_arms_up') {
    ;({ line1, line2 } = linesFromCopy(
      copyRoot.waitUp,
      vars,
      'Klaar?',
      `Rep ${nextRep} van ${repsTarget} — ga in de startpositie.`
    ))
  } else if (rt.phase === 'holding') {
    progress = elapsedHold / holdRequired
    ;({ line1, line2 } = linesFromCopy(
      copyRoot.holding,
      vars,
      `Rep ${nextRep} van ${repsTarget}`,
      secondsLeft >= 1 ? `Nog ${secondsLeft} s — houd de pose vast.` : 'Bijna…'
    ))
  } else if (rt.phase === 'wait_arms_down') {
    ;({ line1, line2 } = linesFromCopy(
      copyRoot.waitDown,
      vars,
      `Rep ${nextRep} van ${repsTarget}`,
      'Ga rustig terug naar de rustpositie.'
    ))
  } else if (rt.phase === 'complete') {
    progress = 1
    ;({ line1, line2 } = linesFromCopy(
      copyRoot.complete,
      vars,
      `Alle ${repsTarget} herhalingen klaar!`,
      'Super gedaan.'
    ))
  }

  return {
    phase: rt.phase,
    line1,
    line2,
    progress,
    sessionProgress01,
    score01,
    averageScore: avgScore,
    lastRepScore: rt.lastRepScore,
    repsCompleted: done,
    repsTarget,
    currentRep: rt.phase === 'complete' ? repsTarget : nextRep,
    flags: { armsUp: up, armsDown: down },
  }
}

/**
 * @param {{ targetReps?: string|number|null, poseConfig: object }} options
 * @returns {object} mutable runtime state
 */
export function createRulesEngineRuntime(options = {}) {
  const { poseConfig } = options
  if (!poseConfig?.rules?.up) {
    throw new Error('rules_engine_v1 requires pose_config.rules.up')
  }
  const timing = resolveRulesRoutineTiming(poseConfig)
  const repsTarget = normalizeTargetReps(options.targetReps ?? poseConfig?.repsTarget)

  return {
    phase: 'wait_arms_up',
    repsCompleted: 0,
    repsTarget,
    lastRepScore: null,
    score: {
      tracker: createRepScoreTracker({ expectedWindowMs: timing.holdRequiredMs }),
      lastNowMs: null,
    },
    upStableStartMs: null,
    holdStartMs: null,
    lastUpMs: null,
    downStableStartMs: null,
    betweenRepsUntilMs: null,
    restStableStartMs: null,
  }
}

/**
 * @param {object} rt runtime from `createRulesEngineRuntime`
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} lm
 * @param {number} nowMs
 * @param {object} poseConfig
 */
export function stepRulesEngine(rt, lm, nowMs, poseConfig) {
  if (!poseConfig?.rules?.up) {
    return buildUi(rt, nowMs, false, false, poseConfig)
  }

  const timing = resolveRulesRoutineTiming(poseConfig)
  const upRes = evaluateUp(lm, poseConfig)
  const downRes = evaluateDown(lm, poseConfig)
  const up = Boolean(upRes.ok)
  const down = Boolean(downRes.ok)

  const prevNow = rt.score?.lastNowMs
  const dt = prevNow != null ? Math.max(0, nowMs - prevNow) : 0
  if (rt.score) rt.score.lastNowMs = nowMs

  if (rt.phase === 'between_reps') {
    if (rt.betweenRepsUntilMs != null && nowMs >= rt.betweenRepsUntilMs) {
      rt.phase = 'wait_rest'
      rt.betweenRepsUntilMs = null
      rt.restStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down, poseConfig)
  }

  if (rt.phase === 'wait_rest') {
    if (down) {
      if (rt.restStableStartMs == null) rt.restStableStartMs = nowMs
      if (nowMs - rt.restStableStartMs >= timing.restStableMs) {
        rt.phase = 'wait_arms_up'
        rt.restStableStartMs = null
        resetCycleTimers(rt)
      }
    } else {
      rt.restStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down, poseConfig)
  }

  if (rt.phase === 'wait_arms_up') {
    if (up) {
      if (rt.upStableStartMs == null) rt.upStableStartMs = nowMs
      if (nowMs - rt.upStableStartMs >= timing.stableUpMs) {
        rt.phase = 'holding'
        rt.holdStartMs = nowMs
        rt.lastUpMs = nowMs
        rt.upStableStartMs = null
        rt.downStableStartMs = null
        if (rt.score?.tracker) startRep(rt.score.tracker)
      }
    } else {
      rt.upStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down, poseConfig)
  }

  if (rt.phase === 'holding') {
    if (rt.score?.tracker) sample(rt.score.tracker, Boolean(up), dt)
    if (up) rt.lastUpMs = nowMs

    if (rt.holdStartMs != null && nowMs - rt.holdStartMs >= timing.holdRequiredMs) {
      rt.phase = 'wait_arms_down'
      rt.downStableStartMs = null
      rt.holdStartMs = null
      rt.lastUpMs = null
      return buildUi(rt, nowMs, up, down, poseConfig)
    }

    const lostLongEnough = rt.lastUpMs != null && nowMs - rt.lastUpMs > timing.holdGraceMs
    if (lostLongEnough) {
      rt.phase = 'wait_arms_up'
      resetCycleTimers(rt)
      if (rt.score?.tracker) startRep(rt.score.tracker)
      return buildUi(rt, nowMs, up, down, poseConfig)
    }

    return buildUi(rt, nowMs, up, down, poseConfig)
  }

  if (rt.phase === 'wait_arms_down') {
    if (down) {
      if (rt.downStableStartMs == null) rt.downStableStartMs = nowMs
      if (nowMs - rt.downStableStartMs >= timing.stableDownMs) {
        rt.repsCompleted = (rt.repsCompleted ?? 0) + 1
        const repScore = rt.score?.tracker ? completeRep(rt.score.tracker) : 0
        rt.lastRepScore = repScore
        rt.downStableStartMs = null
        resetCycleTimers(rt)

        const target = rt.repsTarget ?? DEFAULT_TARGET_REPS
        if (rt.repsCompleted >= target) {
          rt.phase = 'complete'
        } else {
          rt.phase = 'between_reps'
          rt.betweenRepsUntilMs = nowMs + timing.betweenRepsMs
          if (rt.score?.tracker) startRep(rt.score.tracker)
        }
      }
    } else {
      rt.downStableStartMs = null
    }
    return buildUi(rt, nowMs, up, down, poseConfig)
  }

  return buildUi(rt, nowMs, up, down, poseConfig)
}
