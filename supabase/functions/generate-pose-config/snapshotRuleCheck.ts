// Validates pose_config against rest/target capture payloads (same engine as the app).
import { getPoseLandmarkIndex } from '../_shared/pose/poseLandmarks.js'
import { evaluateRuleSet, evaluateRulesUp } from '../_shared/pose/poseRulesEngine.js'

const DEFAULT_REST_RULES = [
  { op: 'below', a: 'LEFT_WRIST', b: 'LEFT_SHOULDER', delta: 0.045 },
  { op: 'below', a: 'RIGHT_WRIST', b: 'RIGHT_SHOULDER', delta: 0.045 },
]

type LandmarkRow = {
  name?: string
  index?: number
  x?: number
  y?: number
  z?: number
  visibility?: number
}

type Snapshot = {
  pose?: {
    landmarks?: LandmarkRow[]
  }
}

type PoseConfig = {
  type?: string
  rules?: {
    up?: unknown
    rest?: unknown
  }
}

function getEffectiveRestRules(poseConfig: PoseConfig): unknown {
  const r = poseConfig?.rules?.rest
  if (Array.isArray(r) && r.length > 0) return r
  if (r && typeof r === 'object' && !Array.isArray(r)) return r
  return DEFAULT_REST_RULES
}

export function capturePayloadToLandmarkArray(payload: Snapshot | null | undefined) {
  const landmarks = Array.isArray(payload?.pose?.landmarks) ? payload.pose!.landmarks! : []
  if (landmarks.length === 0) return null

  const out = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0,
  }))

  for (const p of landmarks) {
    if (!p || typeof p !== 'object') continue
    let idx: number | null = null
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

export function checkPoseConfigAgainstSnapshots(
  poseConfig: PoseConfig,
  rest: Snapshot,
  target: Snapshot,
): { ok: boolean; errors: string[] } {
  const errors: string[] = []

  if (poseConfig?.type !== 'rules_engine_v1' || !poseConfig?.rules?.up) {
    return { ok: false, errors: ['pose_config must be rules_engine_v1 with rules.up.'] }
  }

  const targetLm = capturePayloadToLandmarkArray(target)
  const restLm = capturePayloadToLandmarkArray(rest)

  if (!targetLm) errors.push('TARGET snapshot: insufficient landmarks for rules.up check.')
  if (!restLm) errors.push('REST snapshot: insufficient landmarks for rest check.')

  if (targetLm) {
    const up = evaluateRulesUp(targetLm, poseConfig)
    if (!up.ok) {
      errors.push(`TARGET snapshot fails rules.up: ${up.reason ?? 'unknown'}.`)
    }
  }

  if (restLm) {
    const restRes = evaluateRuleSet(restLm, getEffectiveRestRules(poseConfig), poseConfig)
    if (!restRes.ok) {
      errors.push(`REST snapshot fails rules.rest: ${restRes.reason ?? 'unknown'}.`)
    }
  }

  return { ok: errors.length === 0, errors }
}
