/**
 * Validates generated `pose_config` against kine video frame captures (rest + target).
 * Same rules as live PoseDetection (`poseRulesEngine`).
 */
import { getPoseLandmarkIndex } from '@/lib/kind/poseLandmarks.js'
import { evaluateRuleSet, evaluateRulesUp } from '@/lib/kind/poseRulesEngine.js'
import { RULES_ENGINE_POSE_TYPE } from '@/lib/kind/rulesEngineRoutine.js'

const DEFAULT_REST_RULES = [
  { op: 'below', a: 'LEFT_WRIST', b: 'LEFT_SHOULDER', delta: 0.045 },
  { op: 'below', a: 'RIGHT_WRIST', b: 'RIGHT_SHOULDER', delta: 0.045 },
]

function getEffectiveRestRules(poseConfig) {
  const r = poseConfig?.rules?.rest
  if (Array.isArray(r) && r.length > 0) return r
  if (r && typeof r === 'object' && !Array.isArray(r)) return r
  return DEFAULT_REST_RULES
}

/**
 * @param {object|null|undefined} payload Output of `normalizeLandmarks` (capture payload).
 * @returns {Array<{x:number,y:number,z?:number,visibility?:number}>|null}
 */
export function capturePayloadToLandmarkArray(payload) {
  const landmarks = Array.isArray(payload?.pose?.landmarks) ? payload.pose.landmarks : []
  if (landmarks.length === 0) return null

  const out = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0,
  }))

  for (const p of landmarks) {
    if (!p || typeof p !== 'object') continue
    let idx = null
    try {
      if (typeof p.index === 'number') idx = getPoseLandmarkIndex(p.index)
      else if (p.name) idx = getPoseLandmarkIndex(p.name)
    } catch {
      continue
    }
    const x = Number(p.x)
    const y = Number(p.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    out[idx] = {
      x,
      y,
      z: Number.isFinite(Number(p.z)) ? Number(p.z) : 0,
      visibility: Number.isFinite(Number(p.visibility)) ? Number(p.visibility) : 1,
    }
  }

  const coreIndices = [11, 12, 23, 24]
  const hasCore = coreIndices.some((i) => (out[i]?.visibility ?? 0) >= 0.55)
  return hasCore ? out : null
}

/**
 * @param {object|null|undefined} poseConfig
 * @param {{ rest?: object|null, target?: object|null }} captures
 * @returns {{
 *   ok: boolean,
 *   target: { ok: boolean, reason?: string },
 *   rest: { ok: boolean, reason?: string },
 *   errors: string[],
 * }}
 */
export function checkPoseConfigAgainstCaptures(poseConfig, captures = {}) {
  const errors = []

  if (!poseConfig || poseConfig.type !== RULES_ENGINE_POSE_TYPE) {
    return {
      ok: false,
      target: { ok: false, reason: 'Geen rules_engine_v1 configuratie.' },
      rest: { ok: false, reason: 'Geen rules_engine_v1 configuratie.' },
      errors: ['pose_config.type moet rules_engine_v1 zijn.'],
    }
  }

  if (!poseConfig.rules?.up) {
    return {
      ok: false,
      target: { ok: false, reason: 'rules.up ontbreekt.' },
      rest: { ok: false, reason: 'rules.up ontbreekt.' },
      errors: ['rules.up ontbreekt.'],
    }
  }

  const targetLm = capturePayloadToLandmarkArray(captures.target)
  const restLm = capturePayloadToLandmarkArray(captures.rest)

  if (!targetLm) {
    errors.push('Doelframe: onvoldoende landmarks om te testen.')
  }
  if (!restLm) {
    errors.push('Rustframe: onvoldoende landmarks om te testen.')
  }

  let targetResult = { ok: false, reason: 'Geen doelframe.' }
  if (targetLm) {
    targetResult = evaluateRulesUp(targetLm, poseConfig)
    if (!targetResult.ok) {
      errors.push(
        `Doelframe faalt rules.up: ${targetResult.reason ?? 'onbekende reden'}. Pas de pose aan of genereer opnieuw.`,
      )
    }
  }

  let restResult = { ok: false, reason: 'Geen rustframe.' }
  if (restLm) {
    restResult = evaluateRuleSet(restLm, getEffectiveRestRules(poseConfig), poseConfig)
    if (!restResult.ok) {
      errors.push(
        `Rustframe faalt rules.rest: ${restResult.reason ?? 'onbekende reden'}. Pas de rustpose aan of genereer opnieuw.`,
      )
    }
  }

  const ok = Boolean(targetLm && restLm && targetResult.ok && restResult.ok)
  return { ok, target: targetResult, rest: restResult, errors }
}
