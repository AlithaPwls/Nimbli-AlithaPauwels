/**
 * Target-pose ghost overlay for PoseDetection.
 *
 * Sources (first match wins):
 * 1. `pose_config.reference.target.landmarks` — snapshot from kine video capture (AI flow)
 * 2. Synthesized from `rules.up` + live landmarks (relative constraints → absolute target points)
 */
import { PoseLandmarker } from '@mediapipe/tasks-vision'
import { getPoseLandmarkIndex, POSE_LM } from '@/lib/kind/poseLandmarks.js'
import { getEyesReferenceY, resolveRulesThresholds } from '@/lib/kind/poseRulesEngine.js'

const TARGET_STROKE = '#2bbf9d'
const TARGET_FILL = 'rgba(43, 191, 157, 0.42)'

function num(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function cloneLandmarks(lm) {
  if (!Array.isArray(lm)) return null
  return lm.map((p) => ({
    x: num(p?.x, 0.5),
    y: num(p?.y, 0.5),
    z: num(p?.z, 0),
    visibility: num(p?.visibility, 1),
  }))
}

function isValidPoint(p) {
  return (
    p &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    p.x >= 0 &&
    p.x <= 1 &&
    p.y >= 0 &&
    p.y <= 1
  )
}

/**
 * @param {unknown} poseConfig
 * @returns {Array<{x:number,y:number,z?:number,visibility?:number}>|null}
 */
export function parseStoredTargetLandmarks(poseConfig) {
  const raw =
    poseConfig?.reference?.target?.landmarks ??
    poseConfig?.targetLandmarks ??
    poseConfig?.referenceLandmarks
  if (!Array.isArray(raw) || raw.length === 0) return null

  const out = Array.from({ length: 33 }, () => null)
  let filled = 0

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    let idx = null
    try {
      if (entry.index != null) idx = getPoseLandmarkIndex(entry.index)
      else if (entry.name) idx = getPoseLandmarkIndex(entry.name)
    } catch {
      continue
    }
    const x = Number(entry.x)
    const y = Number(entry.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    out[idx] = {
      x,
      y,
      z: Number.isFinite(Number(entry.z)) ? Number(entry.z) : 0,
      visibility: Number.isFinite(Number(entry.visibility)) ? Number(entry.visibility) : 1,
    }
    filled += 1
  }

  if (filled < 4) return null
  for (let i = 0; i < out.length; i++) {
    if (!out[i]) {
      out[i] = { x: 0.5, y: 0.5, z: 0, visibility: 0 }
    }
  }
  return out
}

/**
 * @param {object[]|object|null|undefined} rules
 * @returns {object[]}
 */
function flattenRules(rules) {
  if (!rules) return []
  if (Array.isArray(rules)) {
    const out = []
    for (const r of rules) out.push(...flattenRules(r))
    return out
  }
  if (typeof rules !== 'object') return []
  const op = typeof rules.op === 'string' ? rules.op.trim().toLowerCase() : ''
  if (op === 'allof' || op === 'all_of') {
    return flattenRules(rules.rules)
  }
  if (op === 'anyof' || op === 'any_of') {
    return flattenRules(rules.rules)
  }
  if (op === 'not') {
    return rules.rule ? flattenRules([rules.rule]) : []
  }
  return [rules]
}

/**
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} target
 * @param {string|number} nameOrIndex
 * @param {{x:number,y:number,z?:number,visibility?:number}} live
 */
function setTargetFromLive(target, nameOrIndex, live) {
  const idx = getPoseLandmarkIndex(nameOrIndex)
  target[idx] = {
    x: live.x,
    y: live.y,
    z: live.z ?? 0,
    visibility: Math.max(live.visibility ?? 0, 0.85),
  }
}

/**
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} liveLm
 * @param {object|null|undefined} poseConfig
 * @returns {Array<{x:number,y:number,z?:number,visibility?:number}>|null}
 */
export function synthesizeTargetLandmarksFromRules(liveLm, poseConfig) {
  const rulesUp = poseConfig?.rules?.up
  const flat = flattenRules(rulesUp)
  if (!liveLm || flat.length === 0) return null

  const target = cloneLandmarks(liveLm)
  if (!target) return null

  const thresholds = resolveRulesThresholds(poseConfig)

  for (const rule of flat) {
    const op = typeof rule?.op === 'string' ? rule.op.trim().toLowerCase() : ''

    if (op === 'visible') {
      const points = Array.isArray(rule.points) ? rule.points : []
      for (const name of points) {
        try {
          const live = liveLm[getPoseLandmarkIndex(name)]
          if (live && isValidPoint(live)) setTargetFromLive(target, name, live)
        } catch {
          /* skip */
        }
      }
      continue
    }

    if (op === 'aboveeyeline' || op === 'above_eye_line') {
      const delta = num(rule.delta, thresholds.aboveEyesDelta ?? thresholds.deltaY)
      const eyeIndices = Array.isArray(rule.eyeIndices)
        ? rule.eyeIndices.map((n) => Math.trunc(Number(n))).filter((n) => n >= 0 && n <= 32)
        : undefined
      const eyeY = getEyesReferenceY(liveLm, poseConfig, eyeIndices)
      if (eyeY == null || !rule.a) continue
      try {
        const idx = getPoseLandmarkIndex(rule.a)
        const live = liveLm[idx]
        if (!live || !isValidPoint(live)) continue
        target[idx] = {
          x: live.x,
          y: eyeY - delta,
          z: live.z ?? 0,
          visibility: 0.95,
        }
      } catch {
        /* skip */
        }
      continue
    }

    if (op === 'above') {
      const delta = num(rule.delta, thresholds.deltaY)
      if (!rule.a || !rule.b) continue
      try {
        const liveB = liveLm[getPoseLandmarkIndex(rule.b)]
        const liveA = liveLm[getPoseLandmarkIndex(rule.a)]
        if (!liveB || !liveA || !isValidPoint(liveB)) continue
        target[getPoseLandmarkIndex(rule.a)] = {
          x: liveA.x,
          y: Number(liveB.y) - delta,
          z: liveA.z ?? 0,
          visibility: 0.95,
        }
      } catch {
        /* skip */
      }
      continue
    }

    if (op === 'below') {
      const delta = num(rule.delta, thresholds.deltaY)
      if (!rule.a || !rule.b) continue
      try {
        const liveB = liveLm[getPoseLandmarkIndex(rule.b)]
        const liveA = liveLm[getPoseLandmarkIndex(rule.a)]
        if (!liveB || !liveA || !isValidPoint(liveB)) continue
        target[getPoseLandmarkIndex(rule.a)] = {
          x: liveA.x,
          y: Number(liveB.y) + delta,
          z: liveA.z ?? 0,
          visibility: 0.95,
        }
      } catch {
        /* skip */
      }
      continue
    }

    if (op === 'ywithin' || op === 'y_within') {
      const maxDelta = num(rule.maxDelta, num(rule.tolerance, thresholds.kneeHipLevelMaxDelta))
      if (!rule.a || !rule.b) continue
      try {
        const liveB = liveLm[getPoseLandmarkIndex(rule.b)]
        const liveA = liveLm[getPoseLandmarkIndex(rule.a)]
        if (!liveB || !liveA || !isValidPoint(liveB)) continue
        const by = Number(liveB.y)
        const ay = Number(liveA.y)
        const midY = Math.abs(ay - by) <= maxDelta ? ay : by + (ay < by ? -maxDelta * 0.5 : maxDelta * 0.5)
        target[getPoseLandmarkIndex(rule.a)] = {
          x: liveA.x,
          y: midY,
          z: liveA.z ?? 0,
          visibility: 0.95,
        }
      } catch {
        /* skip */
      }
    }
  }

  const ruleIndices = new Set()
  for (const rule of flat) {
    const ruleOp = typeof rule?.op === 'string' ? rule.op.trim().toLowerCase() : ''
    for (const key of ['a', 'b', 'c']) {
      if (rule[key] == null) continue
      try {
        ruleIndices.add(getPoseLandmarkIndex(rule[key]))
      } catch {
        /* skip */
      }
    }
    if (ruleOp === 'visible' && Array.isArray(rule.points)) {
      for (const p of rule.points) {
        try {
          ruleIndices.add(getPoseLandmarkIndex(p))
        } catch {
          /* skip */
        }
      }
    }
  }

  let active = 0
  for (const idx of ruleIndices) {
    if (target[idx] && (target[idx].visibility ?? 0) > 0.2) active += 1
  }
  if (active < 2) return null

  for (let i = 0; i < target.length; i++) {
    if (!ruleIndices.has(i)) {
      target[i] = { ...target[i], visibility: 0 }
    }
  }

  return target
}

/**
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>|null} liveLm
 * @param {object|null|undefined} poseConfig
 */
export function resolveTargetLandmarks(liveLm, poseConfig) {
  const stored = parseStoredTargetLandmarks(poseConfig)
  if (stored) return stored
  return synthesizeTargetLandmarksFromRules(liveLm, poseConfig)
}

/**
 * Deep copy so the frozen target skeleton never mutates with live tracking.
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} landmarks
 */
export function freezeTargetLandmarks(landmarks) {
  return landmarks.map((p) => ({
    x: num(p?.x, 0.5),
    y: num(p?.y, 0.5),
    z: num(p?.z, 0),
    visibility: num(p?.visibility, 1),
  }))
}

/**
 * Returns the same target skeleton for the whole session (DB reference or first live snapshot).
 * @param {{ current: Array<{x:number,y:number,z?:number,visibility?:number}>|null }} frozenRef
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>|null} liveLm
 * @param {object|null|undefined} poseConfig
 */
export function acquireFrozenTargetLandmarks(frozenRef, liveLm, poseConfig) {
  if (frozenRef.current?.length) return frozenRef.current

  const stored = parseStoredTargetLandmarks(poseConfig)
  if (stored) {
    frozenRef.current = freezeTargetLandmarks(stored)
    return frozenRef.current
  }

  const synthesized = synthesizeTargetLandmarksFromRules(liveLm, poseConfig)
  if (!synthesized) return null

  frozenRef.current = freezeTargetLandmarks(synthesized)
  return frozenRef.current
}

/**
 * @param {import('@mediapipe/tasks-vision').DrawingUtils} drawingUtils
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} targetLm
 */
export function drawTargetPoseSkeleton(drawingUtils, targetLm) {
  if (!targetLm?.length) return

  const visible = targetLm.filter((p) => (p?.visibility ?? 0) > 0.15 && isValidPoint(p))
  if (visible.length < 2) return

  drawingUtils.drawConnectors(targetLm, PoseLandmarker.POSE_CONNECTIONS, {
    color: TARGET_STROKE,
    lineWidth: 4,
  })
  drawingUtils.drawLandmarks(targetLm, {
    radius: 6,
    color: TARGET_STROKE,
    fillColor: TARGET_FILL,
  })
}

/** Landmark names referenced in rules.up (for debugging / future UI). */
export function landmarkNamesInRulesUp(poseConfig) {
  const flat = flattenRules(poseConfig?.rules?.up)
  const names = new Set()
  for (const rule of flat) {
    for (const key of ['a', 'b', 'c']) {
      if (typeof rule[key] === 'string') names.add(rule[key].trim().toUpperCase())
    }
    if (Array.isArray(rule.points)) {
      for (const p of rule.points) {
        if (typeof p === 'string') names.add(p.trim().toUpperCase())
      }
    }
  }
  return [...names].filter((n) => Object.prototype.hasOwnProperty.call(POSE_LM, n))
}
