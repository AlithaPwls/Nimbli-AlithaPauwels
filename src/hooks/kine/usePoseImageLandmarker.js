import { useCallback, useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { POSE_MODEL_LITE, VISION_WASM } from '@/lib/kind/poseConstants.js'

async function createImagePoseLandmarker(delegate) {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM)
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: POSE_MODEL_LITE,
      delegate,
    },
    runningMode: 'IMAGE',
    numPoses: 1,
  })
}

/**
 * Lazy MediaPipe PoseLandmarker in IMAGE mode. The model is created on first
 * `detect()` call so opening a dialog stays cheap. GPU is tried first with a
 * CPU fallback.
 *
 * @returns {{
 *   detect: (source: HTMLCanvasElement | HTMLImageElement) => Promise<object>,
 *   ready: boolean,
 *   error: Error | null
 * }}
 */
export function usePoseImageLandmarker() {
  const landmarkerRef = useRef(null)
  const createPromiseRef = useRef(null)
  const mountedRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const lm = landmarkerRef.current
      landmarkerRef.current = null
      createPromiseRef.current = null
      if (lm) {
        try {
          lm.close()
        } catch {
          // intentional: closing a half-initialized landmarker can throw
        }
      }
    }
  }, [])

  const ensureLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current
    if (createPromiseRef.current) return createPromiseRef.current

    const promise = (async () => {
      let lm = null
      try {
        lm = await createImagePoseLandmarker('GPU')
      } catch {
        lm = await createImagePoseLandmarker('CPU')
      }
      if (!mountedRef.current) {
        try {
          lm.close()
        } catch {
          // unmounted before init finished — drop instance silently
        }
        throw new Error('Component unmounted before landmarker was ready.')
      }
      landmarkerRef.current = lm
      setReady(true)
      return lm
    })()

    createPromiseRef.current = promise
    try {
      return await promise
    } finally {
      if (landmarkerRef.current) createPromiseRef.current = null
    }
  }, [])

  const detect = useCallback(
    async (source) => {
      try {
        const lm = await ensureLandmarker()
        return lm.detect(source)
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        if (mountedRef.current) setError(err)
        throw err
      }
    },
    [ensureLandmarker]
  )

  return { detect, ready, error }
}
