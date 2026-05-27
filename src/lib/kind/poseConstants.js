/**
 * Shared MediaPipe Tasks Vision constants.
 *
 * - `TASKS_VISION_VERSION` must match the installed `@mediapipe/tasks-vision`
 *   npm version, otherwise the WASM runtime and JS bindings drift apart.
 * - `VISION_WASM` is the CDN folder that `FilesetResolver.forVisionTasks` loads.
 * - `POSE_MODEL_LITE` is the trained pose landmark model (.task file).
 */
export const TASKS_VISION_VERSION = '0.10.35'

export const VISION_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`

export const POSE_MODEL_LITE =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
