/**
 * MediaPipe PoseLandmarker / BlazePose landmark indices (0..32).
 *
 * We keep rule configs human-readable by referring to landmarks by name
 * (e.g. "LEFT_WRIST") instead of numeric indices (e.g. 15).
 *
 * Source of truth is MediaPipe's Pose landmark ordering used by
 * `@mediapipe/tasks-vision` PoseLandmarker.
 */
export const POSE_LM = Object.freeze({
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
})

/**
 * @param {string|number} nameOrIndex e.g. "LEFT_WRIST" or 15
 * @returns {number}
 */
export function getPoseLandmarkIndex(nameOrIndex) {
  if (typeof nameOrIndex === 'number' && Number.isFinite(nameOrIndex)) {
    const idx = Math.trunc(nameOrIndex)
    if (idx < 0 || idx > 32) throw new Error(`Invalid pose landmark index: ${nameOrIndex}`)
    return idx
  }

  if (typeof nameOrIndex !== 'string' || !nameOrIndex.trim()) {
    throw new Error('Pose landmark must be a non-empty string name or a numeric index.')
  }

  const key = nameOrIndex.trim().toUpperCase()
  const idx = POSE_LM[key]
  if (typeof idx !== 'number') {
    throw new Error(`Unknown pose landmark name: "${nameOrIndex}"`)
  }
  return idx
}

/**
 * Fail-fast point resolver.
 * @param {Array<{x:number,y:number,z?:number,visibility?:number}>} lm landmarks array from MediaPipe
 * @param {string|number} nameOrIndex
 * @returns {{x:number,y:number,z?:number,visibility?:number}}
 */
export function getPoseLandmarkPoint(lm, nameOrIndex) {
  if (!Array.isArray(lm)) throw new Error('Expected landmarks array.')
  const idx = getPoseLandmarkIndex(nameOrIndex)
  const p = lm[idx]
  if (!p) throw new Error(`Missing landmark at index ${idx} (${String(nameOrIndex)})`)
  return p
}

