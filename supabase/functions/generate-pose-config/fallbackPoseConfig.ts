// Deterministic pose_config from REST/TARGET snapshots (always passes frame tests when landmarks exist).
import { evaluateRule, resolveRulesThresholds } from '../_shared/pose/poseRulesEngine.js'
import { angleDeg } from '../_shared/pose/poseMath.js'
import { getPoseLandmarkIndex } from '../_shared/pose/poseLandmarks.js'
import { capturePayloadToLandmarkArray, checkPoseConfigAgainstSnapshots } from './snapshotRuleCheck.ts'

type Snapshot = {
  pose?: { landmarks?: Array<{ name?: string; index?: number; x?: number; y?: number; visibility?: number }> }
}

type Rule = Record<string, unknown>

const VIS_MIN = 0.55
const DELTA = 0.04

const CORE_VISIBLE = [
  'LEFT_SHOULDER',
  'RIGHT_SHOULDER',
  'LEFT_ELBOW',
  'RIGHT_ELBOW',
  'LEFT_WRIST',
  'RIGHT_WRIST',
  'LEFT_HIP',
  'RIGHT_HIP',
  'LEFT_KNEE',
  'RIGHT_KNEE',
  'LEFT_ANKLE',
  'RIGHT_ANKLE',
] as const

const EYE_NAMES = [
  'LEFT_EYE_INNER',
  'LEFT_EYE',
  'LEFT_EYE_OUTER',
  'RIGHT_EYE_INNER',
  'RIGHT_EYE',
  'RIGHT_EYE_OUTER',
] as const

const YWITHIN_PAIRS: Array<[string, string]> = [
  ['LEFT_SHOULDER', 'LEFT_HIP'],
  ['RIGHT_SHOULDER', 'RIGHT_HIP'],
  ['LEFT_HIP', 'RIGHT_HIP'],
  ['LEFT_KNEE', 'LEFT_HIP'],
  ['RIGHT_KNEE', 'RIGHT_HIP'],
]

function findLandmarkY(snap: Snapshot, name: string): number | null {
  const lm = Array.isArray(snap?.pose?.landmarks) ? snap.pose!.landmarks! : []
  for (const p of lm) {
    const n = typeof p.name === 'string' ? p.name.trim().toUpperCase() : ''
    if (n !== name) continue
    const y = Number(p.y)
    return Number.isFinite(y) ? y : null
  }
  return null
}

function isVisibleOnSnap(snap: Snapshot, name: string, visMin = VIS_MIN): boolean {
  const lm = Array.isArray(snap?.pose?.landmarks) ? snap.pose!.landmarks! : []
  for (const p of lm) {
    const n = typeof p.name === 'string' ? p.name.trim().toUpperCase() : ''
    if (n !== name) continue
    const v = Number(p.visibility ?? 1)
    return Number.isFinite(v) && v >= visMin
  }
  return false
}

function minEyeY(snap: Snapshot): number | null {
  let min = Infinity
  for (const name of EYE_NAMES) {
    const y = findLandmarkY(snap, name)
    if (y != null && y < min) min = y
  }
  return Number.isFinite(min) ? min : null
}

function dutchCopy(title: string, reps: number) {
  const t = title.trim() || 'Oefening'
  return {
    waitUp: { line1: t, line2: 'Ga in de doelhouding en blijf staan.' },
    holding: { line1: 'Hou vol!', line2: 'Nog {secondsLeft} s — blijf stil staan.' },
    waitDown: { line1: 'Klaar', line2: 'Ga rustig terug naar de rustpositie.' },
    complete: { line1: 'Klaar!', line2: `Super — ${reps} herhalingen voltooid.` },
  }
}

function baseTiming() {
  return {
    stableUpMs: 280,
    holdGraceMs: 450,
    holdRequiredMs: 2000,
    stableDownMs: 350,
    betweenRepsMs: 1600,
    restStableMs: 320,
  }
}

function rulePassesOnLm(lm: Array<{ x: number; y: number; visibility?: number }>, rule: Rule, thresholds: Record<string, number>) {
  const poseConfig = { thresholds }
  const cfg = resolveRulesThresholds(poseConfig)
  return evaluateRule(lm, rule, cfg).ok
}

function buildUpRulesFromTarget(target: Snapshot, targetLm: NonNullable<ReturnType<typeof capturePayloadToLandmarkArray>>): Rule[] {
  const thresholds = { visMin: VIS_MIN, deltaY: DELTA, aboveEyesDelta: DELTA, kneeHipLevelMaxDelta: 0.08 }
  const rules: Rule[] = []

  const visPoints = CORE_VISIBLE.filter((name) => isVisibleOnSnap(target, name)).slice(0, 6)
  if (visPoints.length >= 3) {
    rules.push({ op: 'visible', points: [...visPoints] })
  }

  const eyeY = minEyeY(target)
  if (eyeY != null) {
    for (const arm of ['LEFT_ELBOW', 'RIGHT_ELBOW', 'LEFT_WRIST', 'RIGHT_WRIST'] as const) {
      const y = findLandmarkY(target, arm)
      if (y == null || !isVisibleOnSnap(target, arm)) continue
      if (y < eyeY - 0.03) {
        const candidate = { op: 'aboveEyeLine', a: arm, delta: DELTA }
        if (rulePassesOnLm(targetLm, candidate, thresholds)) {
          rules.push(candidate)
        }
      }
    }
  }

  for (const [a, b] of YWITHIN_PAIRS) {
    const ya = findLandmarkY(target, a)
    const yb = findLandmarkY(target, b)
    if (ya == null || yb == null) continue
    if (!isVisibleOnSnap(target, a) || !isVisibleOnSnap(target, b)) continue
    const dy = Math.abs(ya - yb)
    if (dy > 0.14) continue
    const maxDelta = Math.max(0.05, dy + 0.03)
    const candidate = { op: 'yWithin', a, b, maxDelta: Number(maxDelta.toFixed(3)) }
    if (rulePassesOnLm(targetLm, candidate, thresholds)) {
      rules.push(candidate)
    }
  }

  const aboveBelowPairs: Array<[string, string, 'above' | 'below']> = []
  for (const [a, b] of YWITHIN_PAIRS) {
    const ya = findLandmarkY(target, a)
    const yb = findLandmarkY(target, b)
    if (ya == null || yb == null) continue
    if (ya < yb - DELTA) aboveBelowPairs.push([a, b, 'above'])
    if (ya > yb + DELTA) aboveBelowPairs.push([a, b, 'below'])
  }

  for (const [a, b, op] of aboveBelowPairs) {
    if (a === 'NOSE' || b === 'NOSE') continue
    const candidate = { op, a, b, delta: DELTA }
    if (rulePassesOnLm(targetLm, candidate, thresholds)) {
      rules.push(candidate)
    }
  }

  for (const side of ['LEFT', 'RIGHT'] as const) {
    const hip = `${side}_HIP`
    const knee = `${side}_KNEE`
    const ankle = `${side}_ANKLE`
    if (!isVisibleOnSnap(target, hip) || !isVisibleOnSnap(target, knee) || !isVisibleOnSnap(target, ankle)) {
      continue
    }
    try {
      const hi = getPoseLandmarkIndex(hip)
      const ki = getPoseLandmarkIndex(knee)
      const ai = getPoseLandmarkIndex(ankle)
      const ang = angleDeg(targetLm[hi], targetLm[ki], targetLm[ai])
      if (ang != null && ang >= 55 && ang <= 130) {
        const candidate = {
          op: 'angle',
          a: hip,
          b: knee,
          c: ankle,
          minDeg: Math.max(50, Math.floor(ang - 20)),
          maxDeg: Math.min(140, Math.ceil(ang + 20)),
        }
        if (rulePassesOnLm(targetLm, candidate, thresholds)) {
          rules.push(candidate)
        }
      }
    } catch {
      /* skip */
    }
  }

  const nonVisible = rules.filter((r) => r.op !== 'visible')
  if (nonVisible.length === 0 && visPoints.length >= 3) {
    const a = visPoints[0]
    const b = visPoints[1]
    if (a && b) {
      const ya = findLandmarkY(target, a)
      const yb = findLandmarkY(target, b)
      if (ya != null && yb != null) {
        const maxDelta = Math.max(0.06, Math.abs(ya - yb) + 0.04)
        const candidate = { op: 'yWithin', a, b, maxDelta: Number(maxDelta.toFixed(3)) }
        if (rulePassesOnLm(targetLm, candidate, thresholds)) {
          rules.push(candidate)
        }
      }
    }
  }

  return rules
}

function buildRestRulesFromRest(rest: Snapshot, restLm: NonNullable<ReturnType<typeof capturePayloadToLandmarkArray>>): Rule[] | undefined {
  const thresholds = { visMin: VIS_MIN, deltaY: DELTA }
  const rules: Rule[] = []

  for (const side of ['LEFT', 'RIGHT'] as const) {
    const wrist = `${side}_WRIST`
    const shoulder = `${side}_SHOULDER`
    if (!isVisibleOnSnap(rest, wrist) || !isVisibleOnSnap(rest, shoulder)) continue
    const candidate = { op: 'below', a: wrist, b: shoulder, delta: 0.045 }
    if (rulePassesOnLm(restLm, candidate, thresholds)) {
      rules.push(candidate)
    }
  }

  return rules.length > 0 ? rules : undefined
}

/**
 * Build pose_config using only rules that pass on the captured TARGET/REST frames.
 */
export function buildPoseConfigFromSnapshots(args: {
  exerciseTitle: string
  repsCount: number
  rest: Snapshot
  target: Snapshot
}): Record<string, unknown> | null {
  const targetLm = capturePayloadToLandmarkArray(args.target)
  const restLm = capturePayloadToLandmarkArray(args.rest)
  if (!targetLm || !restLm) return null

  const reps = Math.max(1, Math.min(50, Math.round(args.repsCount)))
  const up = buildUpRulesFromTarget(args.target, targetLm)
  if (up.length === 0) return null

  const config: Record<string, unknown> = {
    version: 1,
    type: 'rules_engine_v1',
    repsTarget: reps,
    thresholds: { visMin: VIS_MIN, deltaY: DELTA, aboveEyesDelta: DELTA, kneeHipLevelMaxDelta: 0.08 },
    timing: baseTiming(),
    rules: {
      up,
      rest: buildRestRulesFromRest(args.rest, restLm),
    },
    copy: dutchCopy(args.exerciseTitle, reps),
  }

  const check = checkPoseConfigAgainstSnapshots(config, args.rest, args.target)
  return check.ok ? config : null
}

export function buildFallbackPoseConfig(args: {
  exerciseTitle: string
  repsCount: number
  rest: Snapshot
  target: Snapshot
}): { config: Record<string, unknown>; kind: string } | null {
  const fromSnapshots = buildPoseConfigFromSnapshots(args)
  if (fromSnapshots) {
    return { config: fromSnapshots, kind: 'snapshot_derived' }
  }
  return null
}
