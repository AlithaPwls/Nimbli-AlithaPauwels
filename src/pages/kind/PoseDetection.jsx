/**
 * Pose detection screen (MediaPipe Tasks Vision).
 *
 * Flow:
 * 1. Load WASM + pose model → create PoseLandmarker (VIDEO mode).
 * 2. Open webcam → attach stream to <video>, wait until frames have a size.
 * 3. Each animation frame: run detectForVideo(video, timestamp) → draw landmarks on <canvas>.
 * 4. Optional `?routine=stretchSterren`: state machine for “stretch naar de sterren”.
 * 5. On unmount: stop camera, cancel rAF, close landmarker (frees GPU/WASM).
 */
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DrawingUtils, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { cn } from '@/lib/utils'
import { createStretchSterrenRuntime, stepStretchSterren } from '@/lib/kind/stretchNaarDeSterrenPose.js'
import { createFlamingoRuntime, stepFlamingo } from '@/lib/kind/flamingoPose.js'
import supabase from '@/lib/supabaseClient.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'

const TASKS_VISION_VERSION = '0.10.35'
const VISION_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`
const POSE_MODEL_LITE =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

async function createPoseLandmarker(delegate = 'GPU') {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM)
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: POSE_MODEL_LITE,
      delegate,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
}

export default function PoseDetection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const exerciseId = searchParams.get('exerciseId')
  const assignmentId = searchParams.get('assignmentId')
  const routine = searchParams.get('routine')
  const repsParam = searchParams.get('reps')
  const xpParam = searchParams.get('xp')
  const { childId } = useActiveChildId()

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const rafRef = useRef(0)

  const [error, setError] = useState(null)
  const [hint, setHint] = useState('Camera starten…')
  const [poseConfig, setPoseConfig] = useState(null)
  const [poseType, setPoseType] = useState(null)
  /** Dutch overlay copy + progress for `routine=stretchSterren` (throttled from rAF). */
  const [poseUi, setPoseUi] = useState(null)
  const didNavigateRewardRef = useRef(false)
  const lastLoggedRepRef = useRef(0)
  const sessionStartMsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!exerciseId) {
        setPoseConfig(null)
        setPoseType(null)
        return
      }
      const { data, error: exErr } = await supabase
        .from('exercises')
        .select('pose_enabled, pose_config')
        .eq('id', exerciseId)
        .maybeSingle()
      if (cancelled) return
      if (exErr) {
        setPoseConfig(null)
        setPoseType(null)
        return
      }
      const enabled = Boolean(data?.pose_enabled)
      const cfg = enabled ? (data?.pose_config ?? null) : null
      const type = typeof cfg?.type === 'string' ? cfg.type : null
      setPoseConfig(cfg)
      setPoseType(type)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [exerciseId])

  const backToExercise = () => {
    const qs = new URLSearchParams()
    if (exerciseId) qs.set('exerciseId', exerciseId)
    if (assignmentId) qs.set('assignmentId', assignmentId)
    const search = qs.toString()
    navigate({
      pathname: '/dashboard/kind/oefening',
      ...(search ? { search: `?${search}` } : {}),
    })
  }

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return undefined

    let cancelled = false
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('Canvas niet beschikbaar.')
      return undefined
    }

    const stretchRt =
      poseType === 'stretch_sterren' || routine === 'stretchSterren'
        ? createStretchSterrenRuntime({ targetReps: repsParam })
        : null
    const flamingoRt =
      poseType === 'flamingo_left_90'
        ? createFlamingoRuntime({ holdRequiredMs: poseConfig?.timing?.holdRequiredMs })
        : null
    const lastPhaseRef = { current: '' }
    const lastUiAtRef = { current: 0 }

    async function run() {
      setError(null)
      setHint('Camera starten…')

      let stream = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
      } catch (e) {
        setError(typeof e?.message === 'string' ? e.message : 'Geen toegang tot de camera.')
        setHint('')
        return
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      video.srcObject = stream
      video.muted = true
      video.playsInline = true
      await video.play()

      await new Promise((resolve) => {
        if (video.videoWidth > 0) resolve()
        else video.addEventListener('loadeddata', () => resolve(), { once: true })
      })

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      setHint('Pose-model laden…')

      let landmarker = null
      try {
        landmarker = await createPoseLandmarker('GPU')
      } catch {
        try {
          landmarker = await createPoseLandmarker('CPU')
        } catch (e2) {
          stream.getTracks().forEach((t) => t.stop())
          video.srcObject = null
          setError(typeof e2?.message === 'string' ? e2.message : 'Pose-model starten mislukt.')
          setHint('')
          return
        }
      }

      if (cancelled) {
        landmarker.close()
        stream.getTracks().forEach((t) => t.stop())
        video.srcObject = null
        return
      }

      landmarkerRef.current = landmarker
      setHint('')

      function onFrame() {
        if (cancelled || !landmarkerRef.current) return

        const now = performance.now()
        const lm = landmarkerRef.current
        const result = lm.detectForVideo(video, now)

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        ctx.save()
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (result.landmarks?.length) {
          const drawingUtils = new DrawingUtils(ctx)
          for (const landmarks of result.landmarks) {
            drawingUtils.drawLandmarks(landmarks, {
              radius: (data) => DrawingUtils.lerp(data.from?.z ?? 0, -0.15, 0.1, 5, 1),
            })
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS)
          }

          if ((stretchRt || flamingoRt) && result.landmarks[0]) {
            const ui = stretchRt
              ? stepStretchSterren(stretchRt, result.landmarks[0], now, poseConfig)
              : stepFlamingo(flamingoRt, result.landmarks[0], now, poseConfig)

            const score01 =
              typeof ui?.score01 === 'number' && Number.isFinite(ui.score01)
                ? Math.max(0, Math.min(1, ui.score01))
                : typeof ui?.averageScore === 'number' && Number.isFinite(ui.averageScore)
                  ? Math.max(0, Math.min(1, ui.averageScore / 100))
                  : 0
            const scorePct = Math.round(score01 * 100)

            // Start timer when the first hold begins.
            if (sessionStartMsRef.current == null && ui.phase === 'holding') {
              sessionStartMsRef.current = now
            }

            if (!didNavigateRewardRef.current && ui.phase === 'complete') {
              didNavigateRewardRef.current = true

              // Persist + navigate asynchronously (do not block rAF).
              void (async () => {
                if (exerciseId && childId) {
                  const started = sessionStartMsRef.current ?? now
                  const durationSeconds = Math.max(0, Math.round((now - started) / 1000))
                  const payload = {
                    child_id: childId,
                    exercise_id: exerciseId,
                    assignment_id: assignmentId || null,
                    completed_at: new Date().toISOString(),
                    success: ui.repsCompleted === ui.repsTarget,
                    score: scorePct,
                    duration: durationSeconds,
                  }
                  const { error: insErr } = await supabase.from('exercise_sessions').insert(payload)
                  if (insErr) {
                    console.warn('[exercise_sessions] insert failed', insErr)
                  }
                }

                const qs = new URLSearchParams()
                if (exerciseId) qs.set('exerciseId', exerciseId)
                if (assignmentId) qs.set('assignmentId', assignmentId)
                if (xpParam) qs.set('xp', xpParam)
                qs.set('accuracy', String(scorePct))
                navigate({ pathname: '/dashboard/kind/oefening/reward', search: `?${qs.toString()}` })
              })()

              return
            }

            const phaseChanged = ui.phase !== lastPhaseRef.current
            if (phaseChanged || now - lastUiAtRef.current > 120) {
              lastPhaseRef.current = ui.phase
              lastUiAtRef.current = now
              setPoseUi(ui)
            }
          }
        }

        ctx.restore()
        rafRef.current = requestAnimationFrame(onFrame)
      }

      rafRef.current = requestAnimationFrame(onFrame)
    }

    void run()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      landmarkerRef.current?.close()
      landmarkerRef.current = null
      const s = video.srcObject
      if (s) s.getTracks().forEach((t) => t.stop())
      video.srcObject = null
      setPoseUi(null)
      didNavigateRewardRef.current = false
      lastLoggedRepRef.current = 0
      sessionStartMsRef.current = null
    }
  }, [routine, poseType, poseConfig, exerciseId, assignmentId, childId, navigate])

  const showRoutineOverlay =
    (poseType === 'stretch_sterren' ||
      routine === 'stretchSterren' ||
      poseType === 'flamingo_left_90') &&
    poseUi

  return (
    <div className="flex min-h-svh flex-col bg-kind-canvas" data-page="kind-pose-detection">
      <header className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-kind-white px-4 py-3">
        <button
          type="button"
          onClick={backToExercise}
          className="inline-flex items-center gap-2 rounded-sm font-nimbli-heading text-[18px] font-bold text-nimbli-ink transition-colors hover:text-kind-green-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
          Terug
        </button>
        {hint ? (
          <p className="max-w-[60%] truncate font-nimbli-body text-xs text-kind-gray">{hint}</p>
        ) : null}
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center p-4">
        {error ? (
          <p className="max-w-md rounded-lg border border-kind-border bg-kind-white px-4 py-3 text-center font-nimbli-body text-sm text-kind-red">
            {error}
          </p>
        ) : null}

        <div className="relative flex max-h-[75vh] max-w-3xl justify-center overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-black/10">
          <div className="relative inline-block max-w-full scale-x-[-1]">
            <video ref={videoRef} className="block max-h-[75vh] w-auto max-w-full" playsInline muted />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute left-0 top-0 size-full max-h-[75vh] max-w-full"
              aria-hidden
            />
          </div>

          {showRoutineOverlay ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/55 via-transparent to-black/75 p-4 pt-3 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-black/45 px-3 py-1 font-nimbli-heading text-sm font-bold tabular-nums text-white ring-1 ring-white/20">
                  {poseUi.repsCompleted} / {poseUi.repsTarget} herhalingen
                </div>
                <svg viewBox="0 0 100 3" className="h-1.5 w-full max-w-xs text-kind-yellow" aria-hidden>
                  <rect x="0" y="0" width="100" height="3" rx="1.5" className="fill-white/20" />
                  <rect
                    x="0"
                    y="0"
                    width={Math.max(0, Math.min(100, (poseUi.sessionProgress01 ?? 0) * 100))}
                    height="3"
                    rx="1.5"
                    className="fill-current"
                  />
                </svg>
              </div>
              <div className="flex flex-col justify-end pt-16">
                <p className="font-nimbli-heading text-lg font-bold text-white drop-shadow-sm">{poseUi.line1}</p>
                <p className="mt-1 font-nimbli-body text-sm leading-snug text-white/95 drop-shadow-sm">{poseUi.line2}</p>
                {poseUi.phase === 'holding' ? (
                  <svg
                    viewBox="0 0 100 4"
                    className={cn(
                      'mx-auto mt-3 h-2 w-full max-w-xs text-kind-green-primary',
                      poseUi.progress >= 1 && 'text-kind-yellow'
                    )}
                    aria-hidden
                  >
                    <rect x="0" y="0" width="100" height="4" rx="2" className="fill-white/25" />
                    <rect x="0" y="0" width={Math.max(0, Math.min(100, poseUi.progress * 100))} height="4" rx="2" className="fill-current" />
                  </svg>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
