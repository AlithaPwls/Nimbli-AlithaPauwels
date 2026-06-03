/**
 * Evaluates declarative pose rules from `exercises.pose_config` (rules_engine_v1).
 *
 * Coordinate system: MediaPipe image space — smaller y is higher on screen.
 * - `above(a,b,delta)` means a is visibly higher than b: a.y < b.y - delta
 * - `below(a,b,delta)` means a is lower than b: a.y > b.y + delta
 * - `aboveEyeLine(a,delta?)` means a.y < min(visible eye y) - delta (stretch-ooglijn; optioneel `eyeIndices`)
 * - `yWithin(a,b,maxDelta?)` means |a.y - b.y| <= maxDelta (flamingo: knie op heuphoogte; default `thresholds.kneeHipLevelMaxDelta`)
 */
import { getPoseLandmarkIndex, getPoseLandmarkPoint } from './poseLandmarks.js'
import { angleDeg, distance2D, pointToLineDistance2D, visibleEnough } from './poseMath.js'

const DEFAULT_VIS_MIN = 0.55
const DEFAULT_DELTA_Y = 0.04

function num(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/**
 * @param {object|null|undefined} poseConfig
 * @returns {{ visMin: number, deltaY: number, aboveEyesDelta: number, kneeHipLevelMaxDelta: number }}
 */
export function resolveRulesThresholds(poseConfig) {
  const t = poseConfig?.thresholds && typeof poseConfig.thresholds === 'object' ? poseConfig.thresholds : {}
  const deltaY = num(t.deltaY, DEFAULT_DELTA_Y)
  return {
    visMin: num(t.visMin, DEFAULT_VIS_MIN),
    deltaY,
    /** Used by `aboveEyeLine`; defaults to `deltaY` / stretch `aboveEyesDelta`. */
    aboveEyesDelta: num(t.aboveEyesDelta, deltaY),
    /** Used by `yWithin` when `maxDelta` is omitted (flamingo knie–heup). */
    kneeHipLevelMaxDelta: num(t.kneeHipLevelMaxDelta, deltaY),
  }
}

/** MediaPipe pose: left/right eye inner, eye, outer (smallest y = highest on screen). */
const DEFAULT_EYE_INDICES = [1, 2, 3, 4, 5, 6]

/**
 * @param {Array<{y?: number, visibility?: number}>} lm
 * @param {number} visMin
 * @param {number[]} eyeIndices
 * @returns {number|null}
 */
function eyesReferenceY(lm, visMin, eyeIndices) {
  let minY = Infinity
  for (const idx of eyeIndices) {
    if (!visibleEnough(lm, idx, visMin)) continue
    const p = lm[idx]
    const y = Number(p?.y)
    if (Number.isFinite(y) && y < minY) minY = y
  }
  return Number.isFinite(minY) ? minY : null
}

/**
 * @param {Array<{y?: number, visibility?: number}>} lm
 * @param {object|null|undefined} poseConfig
 * @param {number[]|undefined} eyeIndices
 */
export function getEyesReferenceY(lm, poseConfig, eyeIndices = DEFAULT_EYE_INDICES) {
  const cfg = resolveRulesThresholds(poseConfig)
  return eyesReferenceY(lm, cfg.visMin, eyeIndices)
}

/**
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} lm
 * @param {object} rule
 * @param {{ visMin: number, deltaY: number, kneeHipLevelMaxDelta: number }} cfg
 * @returns {{ ok: boolean, reason?: string }}
 */
export function evaluateRule(lm, rule, cfg) {
  if (!rule || typeof rule !== 'object') {
    return { ok: false, reason: 'Rule must be a non-null object.' }
  }

  const op = typeof rule.op === 'string' ? rule.op.trim().toLowerCase() : ''

  if (op === 'allof' || op === 'all_of') {
    const rules = Array.isArray(rule.rules) ? rule.rules : []
    for (let i = 0; i < rules.length; i++) {
      const r = evaluateRule(lm, rules[i], cfg)
      if (!r.ok) return { ok: false, reason: r.reason ?? `allOf[${i}] failed` }
    }
    return { ok: true }
  }

  if (op === 'anyof' || op === 'any_of') {
    const rules = Array.isArray(rule.rules) ? rule.rules : []
    if (rules.length === 0) return { ok: false, reason: 'anyOf requires a non-empty rules array.' }
    const reasons = []
    for (let i = 0; i < rules.length; i++) {
      const r = evaluateRule(lm, rules[i], cfg)
      if (r.ok) return { ok: true }
      reasons.push(r.reason ?? `branch ${i}`)
    }
    return { ok: false, reason: `anyOf failed (${reasons.join('; ')})` }
  }

  if (op === 'not') {
    const inner = evaluateRule(lm, rule.rule, cfg)
    return inner.ok ? { ok: false, reason: 'not: inner rule was true' } : { ok: true }
  }

  if (op === 'visible') {
    const points = Array.isArray(rule.points) ? rule.points : []
    if (points.length === 0) return { ok: false, reason: 'visible: points[] is empty.' }
    for (let i = 0; i < points.length; i++) {
      const idx = getPoseLandmarkIndex(points[i])
      if (!visibleEnough(lm, idx, cfg.visMin)) {
        return { ok: false, reason: `visible: landmark ${String(points[i])} below visMin` }
      }
    }
    return { ok: true }
  }

  if (op === 'aboveeyeline' || op === 'above_eye_line') {
    const delta = num(rule.delta, cfg.aboveEyesDelta ?? cfg.deltaY)
    const indices = Array.isArray(rule.eyeIndices)
      ? rule.eyeIndices
          .map((n) => Math.trunc(Number(n)))
          .filter((n) => Number.isFinite(n) && n >= 0 && n <= 32)
      : DEFAULT_EYE_INDICES
    const eyeY = eyesReferenceY(lm, cfg.visMin, indices)
    if (eyeY == null) {
      return { ok: false, reason: 'aboveEyeLine: no visible eye reference (need at least one eye).' }
    }
    let pa
    try {
      pa = getPoseLandmarkPoint(lm, rule.a)
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : 'aboveEyeLine: missing landmark' }
    }
    const ia = getPoseLandmarkIndex(rule.a)
    if (!visibleEnough(lm, ia, cfg.visMin)) {
      return { ok: false, reason: 'aboveEyeLine: point not visible enough' }
    }
    const ay = Number(pa.y)
    if (!Number.isFinite(ay)) return { ok: false, reason: 'aboveEyeLine: invalid coordinates' }
    const ok = ay < eyeY - delta
    return ok
      ? { ok: true }
      : { ok: false, reason: `aboveEyeLine: ${String(rule.a)} not clearly above eye line (delta ${delta})` }
  }

  if (op === 'above') {
    const delta = num(rule.delta, cfg.deltaY)
    let pa
    let pb
    try {
      pa = getPoseLandmarkPoint(lm, rule.a)
      pb = getPoseLandmarkPoint(lm, rule.b)
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : 'above: missing landmark' }
    }
    const ia = getPoseLandmarkIndex(rule.a)
    const ib = getPoseLandmarkIndex(rule.b)
    if (!visibleEnough(lm, ia, cfg.visMin) || !visibleEnough(lm, ib, cfg.visMin)) {
      return { ok: false, reason: 'above: point not visible enough' }
    }
    const ay = Number(pa.y)
    const by = Number(pb.y)
    if (!Number.isFinite(ay) || !Number.isFinite(by)) return { ok: false, reason: 'above: invalid coordinates' }
    const ok = ay < by - delta
    return ok ? { ok: true } : { ok: false, reason: `above: ${String(rule.a)} not above ${String(rule.b)} (delta ${delta})` }
  }

  if (op === 'below') {
    const delta = num(rule.delta, cfg.deltaY)
    let pa
    let pb
    try {
      pa = getPoseLandmarkPoint(lm, rule.a)
      pb = getPoseLandmarkPoint(lm, rule.b)
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : 'below: missing landmark' }
    }
    const ia = getPoseLandmarkIndex(rule.a)
    const ib = getPoseLandmarkIndex(rule.b)
    if (!visibleEnough(lm, ia, cfg.visMin) || !visibleEnough(lm, ib, cfg.visMin)) {
      return { ok: false, reason: 'below: point not visible enough' }
    }
    const ay = Number(pa.y)
    const by = Number(pb.y)
    if (!Number.isFinite(ay) || !Number.isFinite(by)) return { ok: false, reason: 'below: invalid coordinates' }
    const ok = ay > by + delta
    return ok ? { ok: true } : { ok: false, reason: `below: ${String(rule.a)} not below ${String(rule.b)} (delta ${delta})` }
  }

  if (op === 'ywithin' || op === 'y_within') {
    const maxDelta = num(rule.maxDelta, num(rule.tolerance, cfg.kneeHipLevelMaxDelta))
    if (!Number.isFinite(maxDelta)) {
      return { ok: false, reason: 'yWithin: maxDelta (or thresholds.kneeHipLevelMaxDelta) must be finite.' }
    }
    let pa
    let pb
    try {
      pa = getPoseLandmarkPoint(lm, rule.a)
      pb = getPoseLandmarkPoint(lm, rule.b)
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : 'yWithin: missing landmark' }
    }
    const ia = getPoseLandmarkIndex(rule.a)
    const ib = getPoseLandmarkIndex(rule.b)
    if (!visibleEnough(lm, ia, cfg.visMin) || !visibleEnough(lm, ib, cfg.visMin)) {
      return { ok: false, reason: 'yWithin: point not visible enough' }
    }
    const ay = Number(pa.y)
    const by = Number(pb.y)
    if (!Number.isFinite(ay) || !Number.isFinite(by)) return { ok: false, reason: 'yWithin: invalid coordinates' }
    const dy = Math.abs(ay - by)
    const ok = dy <= maxDelta
    return ok
      ? { ok: true }
      : { ok: false, reason: `yWithin: |y(${String(rule.a)})-y(${String(rule.b)})|=${dy.toFixed(4)} > ${maxDelta}` }
  }

  if (op === 'distance') {
    const max = num(rule.max, NaN)
    if (!Number.isFinite(max)) return { ok: false, reason: 'distance: max must be a finite number.' }
    let pa
    let pb
    try {
      pa = getPoseLandmarkPoint(lm, rule.a)
      pb = getPoseLandmarkPoint(lm, rule.b)
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : 'distance: missing landmark' }
    }
    const ia = getPoseLandmarkIndex(rule.a)
    const ib = getPoseLandmarkIndex(rule.b)
    if (!visibleEnough(lm, ia, cfg.visMin) || !visibleEnough(lm, ib, cfg.visMin)) {
      return { ok: false, reason: 'distance: point not visible enough' }
    }
    const d = distance2D(pa, pb)
    return d <= max ? { ok: true } : { ok: false, reason: `distance: ${d.toFixed(4)} > max ${max}` }
  }

  if (op === 'angle') {
    const minDeg = num(rule.minDeg, NaN)
    const maxDeg = num(rule.maxDeg, NaN)
    if (!Number.isFinite(minDeg) || !Number.isFinite(maxDeg)) {
      return { ok: false, reason: 'angle: minDeg and maxDeg must be finite numbers.' }
    }
    let pa
    let pb
    let pc
    try {
      pa = getPoseLandmarkPoint(lm, rule.a)
      pb = getPoseLandmarkPoint(lm, rule.b)
      pc = getPoseLandmarkPoint(lm, rule.c)
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : 'angle: missing landmark' }
    }
    const ia = getPoseLandmarkIndex(rule.a)
    const ib = getPoseLandmarkIndex(rule.b)
    const ic = getPoseLandmarkIndex(rule.c)
    if (!visibleEnough(lm, ia, cfg.visMin) || !visibleEnough(lm, ib, cfg.visMin) || !visibleEnough(lm, ic, cfg.visMin)) {
      return { ok: false, reason: 'angle: point not visible enough' }
    }
    const ang = angleDeg(pa, pb, pc)
    if (ang == null) return { ok: false, reason: 'angle: could not compute (degenerate triangle).' }
    const ok = ang >= minDeg && ang <= maxDeg
    return ok ? { ok: true } : { ok: false, reason: `angle: ${ang.toFixed(1)}° not in [${minDeg}, ${maxDeg}]` }
  }

  if (op === 'collinear') {
    const tol = num(rule.tol, num(rule.tolerance, NaN))
    if (!Number.isFinite(tol)) return { ok: false, reason: 'collinear: tol (or tolerance) must be a finite number.' }
    let pa
    let pb
    let pc
    try {
      pa = getPoseLandmarkPoint(lm, rule.a)
      pb = getPoseLandmarkPoint(lm, rule.b)
      pc = getPoseLandmarkPoint(lm, rule.c)
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : 'collinear: missing landmark' }
    }
    const ia = getPoseLandmarkIndex(rule.a)
    const ib = getPoseLandmarkIndex(rule.b)
    const ic = getPoseLandmarkIndex(rule.c)
    if (!visibleEnough(lm, ia, cfg.visMin) || !visibleEnough(lm, ib, cfg.visMin) || !visibleEnough(lm, ic, cfg.visMin)) {
      return { ok: false, reason: 'collinear: point not visible enough' }
    }
    const d = pointToLineDistance2D(pc, pa, pb)
    if (d == null) return { ok: false, reason: 'collinear: degenerate line a-b.' }
    return d <= tol ? { ok: true } : { ok: false, reason: `collinear: distance ${d.toFixed(4)} > tol ${tol}` }
  }

  return { ok: false, reason: `Unknown rule op: "${rule.op}"` }
}

/**
 * Top-level rules: array = implicit allOf, or single rule object.
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} lm
 * @param {object[]|object|null|undefined} rules
 * @param {object|null|undefined} poseConfig
 * @returns {{ ok: boolean, reason?: string }}
 */
export function evaluateRuleSet(lm, rules, poseConfig) {
  const cfg = resolveRulesThresholds(poseConfig)

  if (rules == null) {
    return { ok: false, reason: 'No rules provided (null/undefined).' }
  }

  if (Array.isArray(rules)) {
    if (rules.length === 0) return { ok: false, reason: 'Rules array is empty.' }
    return evaluateRule(lm, { op: 'allOf', rules }, cfg)
  }

  return evaluateRule(lm, rules, cfg)
}

/**
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} lm
 * @param {object|null|undefined} poseConfig
 * @returns {{ ok: boolean, reason?: string }}
 */
export function evaluateRulesUp(lm, poseConfig) {
  return evaluateRuleSet(lm, poseConfig?.rules?.up, poseConfig)
}

/**
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} lm
 * @param {object|null|undefined} poseConfig
 * @returns {{ ok: boolean, reason?: string }}
 */
export function evaluateRulesRest(lm, poseConfig) {
  return evaluateRuleSet(lm, poseConfig?.rules?.rest, poseConfig)
}
