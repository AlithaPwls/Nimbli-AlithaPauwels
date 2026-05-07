/**
 * Flamingo Pose: hold a leg position for N ms.
 *
 * Config-driven via exercises.pose_config:
 * - type: "flamingo_left_90"
 * - thresholds.visMin (default 0.55)
 * - thresholds.kneeAngleMinDeg / kneeAngleMaxDeg (default 70..110)
 * - thresholds.kneeHipLevelMaxDelta (default 0.04) // |knee.y - hip.y| must be <= this
 * - timing.stableUpMs (default 400)
 * - timing.holdGraceMs (default 500)
 * - timing.holdRequiredMs (default 3000)
 *
 * Indices follow MediaPipe PoseLandmarker (BlazePose).
 */

const LM = {
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

const DEFAULTS = {
  thresholds: {
    visMin: 0.55,
    kneeAngleMinDeg: 70,
    kneeAngleMaxDeg: 110,
    kneeHipLevelMaxDelta: 0.04,
  },
  timing: {
    stableUpMs: 400,
    holdGraceMs: 500,
    holdRequiredMs: 3000,
  },
}

function resolve(cfg) {
  const thresholds = cfg?.thresholds && typeof cfg.thresholds === 'object' ? cfg.thresholds : {}
  const timing = cfg?.timing && typeof cfg.timing === 'object' ? cfg.timing : {}

  const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

  return {
    thresholds: {
      visMin: num(thresholds.visMin, DEFAULTS.thresholds.visMin),
      kneeAngleMinDeg: num(thresholds.kneeAngleMinDeg, DEFAULTS.thresholds.kneeAngleMinDeg),
      kneeAngleMaxDeg: num(thresholds.kneeAngleMaxDeg, DEFAULTS.thresholds.kneeAngleMaxDeg),
      kneeHipLevelMaxDelta: num(thresholds.kneeHipLevelMaxDelta, DEFAULTS.thresholds.kneeHipLevelMaxDelta),
    },
    timing: {
      stableUpMs: num(timing.stableUpMs, DEFAULTS.timing.stableUpMs),
      holdGraceMs: num(timing.holdGraceMs, DEFAULTS.timing.holdGraceMs),
      holdRequiredMs: num(timing.holdRequiredMs, DEFAULTS.timing.holdRequiredMs),
    },
  }
}

function visibleEnough(lm, idx, visMin) {
  const v = lm[idx]?.visibility
  return (v == null ? 1 : v) >= visMin
}

function angleDeg(a, b, c) {
  // Angle at point b for triangle a-b-c.
  const bax = (a?.x ?? 0) - (b?.x ?? 0)
  const bay = (a?.y ?? 0) - (b?.y ?? 0)
  const bcx = (c?.x ?? 0) - (b?.x ?? 0)
  const bcy = (c?.y ?? 0) - (b?.y ?? 0)
  const dot = bax * bcx + bay * bcy
  const mag1 = Math.hypot(bax, bay)
  const mag2 = Math.hypot(bcx, bcy)
  if (mag1 === 0 || mag2 === 0) return null
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  return (Math.acos(cos) * 180) / Math.PI
}

function leftLegBent90AtHipLevel(lm, cfg) {
  const { visMin, kneeAngleMinDeg, kneeAngleMaxDeg, kneeHipLevelMaxDelta } = cfg.thresholds
  const hip = lm[LM.LEFT_HIP]
  const knee = lm[LM.LEFT_KNEE]
  const ankle = lm[LM.LEFT_ANKLE]
  if (!hip || !knee || !ankle) return false
  if (!visibleEnough(lm, LM.LEFT_HIP, visMin)) return false
  if (!visibleEnough(lm, LM.LEFT_KNEE, visMin)) return false
  if (!visibleEnough(lm, LM.LEFT_ANKLE, visMin)) return false

  // Knee height ~ hip height.
  const kneeAtHip = Math.abs(knee.y - hip.y) <= kneeHipLevelMaxDelta
  if (!kneeAtHip) return false

  const ang = angleDeg(hip, knee, ankle)
  if (ang == null) return false
  const kneeBent = ang >= kneeAngleMinDeg && ang <= kneeAngleMaxDeg
  return kneeBent
}

export function createFlamingoRuntime(options = {}) {
  const holdRequiredMs = Number(options.holdRequiredMs)
  return {
    phase: 'wait_up',
    upStableStartMs: null,
    holdStartMs: null,
    lastUpMs: null,
    repsCompleted: 0,
    repsTarget: 1,
    holdRequiredMs: Number.isFinite(holdRequiredMs) ? holdRequiredMs : null,
  }
}

export function stepFlamingo(rt, lm, nowMs, poseConfig) {
  const cfg = resolve(poseConfig)
  const holdRequired = rt.holdRequiredMs ?? cfg.timing.holdRequiredMs

  const up = leftLegBent90AtHipLevel(lm, cfg)
  const side = up ? 'left' : null

  if (rt.phase === 'wait_up') {
    if (up) {
      if (rt.upStableStartMs == null) rt.upStableStartMs = nowMs
      if (nowMs - rt.upStableStartMs >= cfg.timing.stableUpMs) {
        rt.phase = 'holding'
        rt.holdStartMs = nowMs
        rt.lastUpMs = nowMs
        rt.upStableStartMs = null
      }
    } else {
      rt.upStableStartMs = null
    }
    return buildUi(rt, nowMs, { up, side, holdRequired })
  }

  if (rt.phase === 'holding') {
    if (up) rt.lastUpMs = nowMs

    if (rt.holdStartMs != null && nowMs - rt.holdStartMs >= holdRequired) {
      rt.phase = 'complete'
      rt.repsCompleted = 1
      return buildUi(rt, nowMs, { up: true, side, holdRequired })
    }

    const lostLongEnough = rt.lastUpMs != null && nowMs - rt.lastUpMs > cfg.timing.holdGraceMs
    if (lostLongEnough) {
      rt.phase = 'wait_up'
      rt.holdStartMs = null
      rt.lastUpMs = null
      rt.upStableStartMs = null
    }
    return buildUi(rt, nowMs, { up, side, holdRequired })
  }

  return buildUi(rt, nowMs, { up, side, holdRequired })
}

function buildUi(rt, nowMs, { up, side, holdRequired }) {
  const elapsed = rt.phase === 'holding' && rt.holdStartMs != null ? Math.max(0, nowMs - rt.holdStartMs) : 0
  const progress = rt.phase === 'holding' ? Math.min(1, elapsed / holdRequired) : rt.phase === 'complete' ? 1 : 0
  const score01 = progress
  const averageScore = Math.round(score01 * 100)
  const left = Math.max(0, Math.ceil((holdRequired - elapsed) / 1000))

  let line1 = 'Flamingo Pose'
  let line2 = 'Til één voet op en plaats hem tegen je knie.'

  if (rt.phase === 'wait_up') {
    line1 = 'Flamingo Pose'
    line2 = 'Zoek balans: voet tegen je knie en blijf stil.'
  } else if (rt.phase === 'holding') {
    line1 = 'Hou vol!'
    line2 = left >= 1 ? `Nog ${left} s — blijf stil staan.` : 'Bijna…'
  } else if (rt.phase === 'complete') {
    line1 = 'Klaar!'
    line2 = 'Super — je hield je balans.'
  }

  return {
    phase: rt.phase,
    line1,
    line2,
    progress,
    sessionProgress01: progress,
    score01,
    averageScore,
    repsCompleted: rt.repsCompleted ?? 0,
    repsTarget: rt.repsTarget ?? 1,
    currentRep: rt.phase === 'complete' ? 1 : 1,
    flags: { up, side },
  }
}

