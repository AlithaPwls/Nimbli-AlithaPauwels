/**
 * 1. doorspoelen in video
 * 2. knip moment uit video
 */


import { POSE_LM } from '@/lib/kind/poseLandmarks.js'

/** @type {Map<number, string>} */
const POSE_INDEX_TO_NAME = new Map(
  Object.entries(POSE_LM).map(([name, index]) => [index, name])
)

const SEEK_EPS = 0.001
const SEEK_TIMEOUT_MS = 1000

/**
 * @param {HTMLVideoElement} video
 * @param {number} tSeconds
 * @returns {Promise<void>}
 */
export function seekToTime(video, tSeconds) {
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null
  const clamped =
    duration != null
      ? Math.min(Math.max(0, tSeconds), Math.max(0, duration - 1e-6))
      : Math.max(0, tSeconds)

  if (Math.abs(video.currentTime - clamped) < SEEK_EPS) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      clearTimeout(timer)
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    const timer = window.setTimeout(() => {
      video.removeEventListener('seeked', onSeeked)
      reject(new Error('Seek timed out.'))
    }, SEEK_TIMEOUT_MS)

    video.addEventListener('seeked', onSeeked, { once: true })
    video.currentTime = clamped
  })
}

/**
 * @param {HTMLVideoElement} video
 * @param {HTMLCanvasElement} canvas
 * @returns {HTMLCanvasElement}
 */
export function captureVideoFrame(video, canvas) {
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) {
    throw new Error('Video has no frame dimensions yet.')
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable.')
  }

  canvas.width = w
  canvas.height = h
  ctx.drawImage(video, 0, 0, w, h)
  return canvas
}

/**
 * @param {object} result MediaPipe PoseLandmarker `detect` result
 * @param {{ videoFileName: string, frameTimeSec: number, imageWidth: number, imageHeight: number }} meta
 * @returns {object|null}
 */
export function normalizeLandmarks(result, meta) {
  const lm = result?.landmarks?.[0]
  if (!Array.isArray(lm) || lm.length === 0) {
    return null
  }

  const world = result?.worldLandmarks?.[0]

  function rowToNamed(row) {
    return row.map((p, index) => ({
      name: POSE_INDEX_TO_NAME.get(index) ?? `INDEX_${index}`,
      index,
      x: p.x,
      y: p.y,
      z: p.z,
      ...(typeof p.visibility === 'number' ? { visibility: p.visibility } : {}),
    }))
  }

  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    source: {
      videoFileName: meta.videoFileName,
      frameTimeSec: meta.frameTimeSec,
      imageWidth: meta.imageWidth,
      imageHeight: meta.imageHeight,
    },
    pose: {
      landmarks: rowToNamed(lm),
      worldLandmarks: Array.isArray(world) && world.length > 0 ? rowToNamed(world) : [],
    },
  }
}

/** Matches `DEFAULT_VIS_MIN` in `poseRulesEngine.js` so warnings line up with what the engine considers "visible". */
const DEFAULT_VIS_MIN = 0.55

/**
 * @param {object|null|undefined} payload Output of `normalizeLandmarks`.
 * @param {number} [visMin=0.55]
 * @returns {{ totalPoints: number, visibleCount: number, lowVisibilityNames: string[] }}
 */
export function summarizeVisibility(payload, visMin = DEFAULT_VIS_MIN) {
  const landmarks = Array.isArray(payload?.pose?.landmarks) ? payload.pose.landmarks : []
  let visibleCount = 0
  const lowVisibilityNames = []
  for (const lm of landmarks) {
    const v = typeof lm?.visibility === 'number' ? lm.visibility : 0
    if (v >= visMin) {
      visibleCount += 1
    } else {
      lowVisibilityNames.push(lm?.name ?? `INDEX_${lm?.index ?? '?'}`)
    }
  }
  return {
    totalPoints: landmarks.length,
    visibleCount,
    lowVisibilityNames,
  }
}
