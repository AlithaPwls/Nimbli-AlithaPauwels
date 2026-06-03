function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

/**
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 */
export function distance2D(a, b) {
  const dx = (a?.x ?? 0) - (b?.x ?? 0)
  const dy = (a?.y ?? 0) - (b?.y ?? 0)
  return Math.hypot(dx, dy)
}

/**
 * Angle at point b for triangle a-b-c in degrees.
 * Returns null if it can't be computed.
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @param {{x:number,y:number}} c
 */
export function angleDeg(a, b, c) {
  const bax = (a?.x ?? 0) - (b?.x ?? 0)
  const bay = (a?.y ?? 0) - (b?.y ?? 0)
  const bcx = (c?.x ?? 0) - (b?.x ?? 0)
  const bcy = (c?.y ?? 0) - (b?.y ?? 0)

  const dot = bax * bcx + bay * bcy
  const mag1 = Math.hypot(bax, bay)
  const mag2 = Math.hypot(bcx, bcy)
  if (mag1 === 0 || mag2 === 0) return null

  const cos = clamp(dot / (mag1 * mag2), -1, 1)
  return (Math.acos(cos) * 180) / Math.PI
}

/**
 * Distance from point p to the infinite line passing through a-b.
 * In our normalized coordinate space (0..1), this returns a normalized distance too.
 * @param {{x:number,y:number}} p
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 */
export function pointToLineDistance2D(p, a, b) {
  const ax = a?.x ?? 0
  const ay = a?.y ?? 0
  const bx = b?.x ?? 0
  const by = b?.y ?? 0
  const px = p?.x ?? 0
  const py = p?.y ?? 0

  const abx = bx - ax
  const aby = by - ay
  const denom = Math.hypot(abx, aby)
  if (denom === 0) return null

  // Area * 2 of triangle divided by base length gives height.
  const num = Math.abs(abx * (ay - py) - (ax - px) * aby)
  return num / denom
}

/**
 * MediaPipe landmarks include optional visibility. We treat missing visibility as "fully visible"
 * (same behavior as existing pose files in this repo).
 * @param {Array<{visibility?:number}>} lm
 * @param {number} idx
 * @param {number} visMin
 */
export function visibleEnough(lm, idx, visMin) {
  const v = lm?.[idx]?.visibility
  const vv = v == null ? 1 : Number(v)
  return Number.isFinite(vv) && vv >= visMin
}

