/**
 * Pose detection screen (MediaPipe Tasks Vision).
 *
 * Flow:
 * 1. Load WASM + pose model → create PoseLandmarker (VIDEO mode).
 * 2. Open webcam → attach stream to <video>, wait until frames have a size.
 * 3. Each animation frame: run detectForVideo(video, timestamp) → draw landmarks on <canvas>.
 * 4. “Stretch naar de sterren”: zelfde als `rules_engine_v1` — volledige `pose_config` in Supabase (`pose_enabled`).
 * 5. Andere oefeningen: `pose_config.type === "rules_engine_v1"` + `rules` / `copy` in DB.
 * 6. On unmount: stop camera, cancel rAF, close landmarker (frees GPU/WASM).
 */
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DrawingUtils, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { cn } from '@/lib/utils'
import {
  RULES_ENGINE_POSE_TYPE,
  createRulesEngineRuntime,
  stepRulesEngine,
} from '@/lib/kind/rulesEngineRoutine.js'
import supabase from '@/lib/supabaseClient.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'
import { useSpeechGuide } from '@/hooks/kind/useSpeechGuide.js'
import { POSE_MODEL_LITE, VISION_WASM } from '@/lib/kind/poseConstants.js'

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

function pct(value) {
  return Math.max(0, Math.min(100, Number(value) * 100 || 0))
}

function getDistanceOverlayCopy(poseUi) {
  if (!poseUi) {
    return {
      title: 'Maak je klaar',
      subtitle: 'Ga volledig in beeld staan.',
      progressLabel: 'Voorbereiden',
    }
  }

  switch (poseUi.phase) {
    case 'between_reps':
      return {
        title: poseUi.secondsUntilNext > 0 ? `Pauze ${poseUi.secondsUntilNext}s` : 'Neem rustpositie',
        subtitle: 'Wacht tot de teller klaar is. Daarna mag je terug naar rust.',
        progressLabel: 'Wachten op volgende stap',
      }
    case 'wait_rest':
      return {
        title: 'Houd rustpositie',
        subtitle: `Blijf ${poseUi.restRequiredSeconds} seconde stil. Als de balk vol is, mag je starten.`,
        progressLabel: 'Rustpositie vasthouden',
      }
    case 'wait_arms_up':
      return {
        title: `Start herhaling ${poseUi.currentRep}`,
        subtitle: 'Rustpositie is goed. Ga nu naar de oefenhouding.',
        progressLabel: 'Klaar voor de volgende herhaling',
      }
    case 'holding':
      return {
        title: poseUi.secondsLeft > 0 ? `Nog ${poseUi.secondsLeft}s` : 'Bijna klaar',
        subtitle: poseUi.line2 || 'Houd de pose vast tot de balk vol is.',
        progressLabel: 'Pose vasthouden',
      }
    case 'wait_arms_down':
      return {
        title: 'Terug naar rust',
        subtitle: 'Ga rustig terug naar de rustpositie en blijf even stil.',
        progressLabel: 'Rust detecteren',
      }
    case 'complete':
      return {
        title: 'Klaar',
        subtitle: poseUi.line2 || 'Super gedaan.',
        progressLabel: 'Oefening voltooid',
      }
    default:
      return {
        title: poseUi.line1 || 'Volg de instructie',
        subtitle: poseUi.line2 || 'Blijf goed in beeld.',
        progressLabel: 'Voortgang',
      }
  }
}

function getPoseSpeechPrompt(poseUi, overlayCopy) {
  if (!poseUi) return null

  switch (poseUi.phase) {
    case 'between_reps':
      return {
        key: `between_reps:${poseUi.repsCompleted}`,
        text: 'Pauze. Wacht even.',
      }
    case 'wait_rest':
      return {
        key: `wait_rest:${poseUi.currentRep}`,
        text: 'Houd rustpositie. Blijf even stil.',
      }
    case 'wait_arms_up':
      return {
        key: `wait_arms_up:${poseUi.currentRep}`,
        text: `Start herhaling ${poseUi.currentRep}. Ga naar de oefenhouding.`,
      }
    case 'holding': {
      const seconds = Number(poseUi.secondsLeft)
      if (Number.isFinite(seconds) && seconds > 0) {
        return {
          key: `holding:${poseUi.currentRep}:${seconds}`,
          text: `Nog ${seconds} seconden.`,
        }
      }
      return {
        key: `holding:${poseUi.currentRep}:done`,
        text: 'Bijna klaar.',
      }
    }
    case 'wait_arms_down':
      return {
        key: `wait_arms_down:${poseUi.currentRep}`,
        text: 'Terug naar rust.',
      }
    case 'complete':
      return {
        key: 'complete',
        text: 'Klaar. Super gedaan.',
      }
    default:
      return {
        key: `${poseUi.phase}:${overlayCopy.title}`,
        text: [overlayCopy.title, overlayCopy.subtitle].filter(Boolean).join('. '),
      }
  }
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
  const {
    supported: speechSupported,
    muted: speechMuted,
    setMuted: setSpeechMuted,
    speak,
  } = useSpeechGuide({ rate: 1 })

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const rafRef = useRef(0)
  const lastSpokenKeyRef = useRef('')

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

    const isStretchSterren = poseType === 'stretch_sterren' || routine === 'stretchSterren'
    const hasDbRulesEngine =
      poseConfig?.type === RULES_ENGINE_POSE_TYPE &&
      Array.isArray(poseConfig?.rules?.up) &&
      poseConfig.rules.up.length > 0
    const rulesEnginePoseConfig = hasDbRulesEngine ? poseConfig : null

    let rulesRt = null
    if (rulesEnginePoseConfig?.rules?.up) {
      try {
        rulesRt = createRulesEngineRuntime({ targetReps: repsParam, poseConfig: rulesEnginePoseConfig })
      } catch (e) {
        console.warn('[PoseDetection] rules_engine runtime failed', e)
      }
    }
    const lastPhaseRef = { current: '' }
    const lastUiAtRef = { current: 0 }

    async function run() {
      if (!ctx) {
        setError('Canvas niet beschikbaar.')
        return
      }

      setError(null)
      setHint('Camera starten…')

      const needsRulesEngine = poseType === RULES_ENGINE_POSE_TYPE || isStretchSterren
      if (needsRulesEngine) {
        if (!rulesEnginePoseConfig?.rules?.up) {
          setError('Deze pose-oefening mist configuratie (pose_config.rules.up).')
          setHint('')
          return
        }
        if (!rulesRt) {
          setError('Pose-oefening kon niet starten (controleer pose_config).')
          setHint('')
          return
        }
      }

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

          if (rulesRt && result.landmarks[0]) {
            const ui = stepRulesEngine(rulesRt, result.landmarks[0], now, rulesEnginePoseConfig)

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
  }, [routine, poseType, poseConfig, repsParam, exerciseId, assignmentId, childId, xpParam, navigate])

  const showRoutineOverlay =
    (poseType === 'stretch_sterren' ||
      routine === 'stretchSterren' ||
      poseType === RULES_ENGINE_POSE_TYPE) &&
    poseUi
  const overlayCopy = getDistanceOverlayCopy(poseUi)
  const speechPrompt = showRoutineOverlay ? getPoseSpeechPrompt(poseUi, overlayCopy) : null
  const speechPromptKey = speechPrompt?.key ?? ''
  const speechPromptText = speechPrompt?.text ?? ''

  useEffect(() => {
    if (!speechSupported || speechMuted || !speechPromptKey || !speechPromptText) return
    if (lastSpokenKeyRef.current === speechPromptKey) return

    lastSpokenKeyRef.current = speechPromptKey
    speak(speechPromptText)
  }, [speechMuted, speechPromptKey, speechPromptText, speechSupported, speak])

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-black text-white" data-page="kind-pose-detection">
      <header className="absolute left-0 right-0 top-0 z-30 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent px-4 pb-8 pt-4 sm:px-5">
        <button
          type="button"
          onClick={backToExercise}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 font-nimbli-heading text-sm font-black text-nimbli-ink shadow-lg transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-kind-green-primary sm:text-base"
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
          Terug
        </button>
        <div className="flex items-start gap-2">
          {hint ? (
            <p className="rounded-full bg-black/55 px-3.5 py-2 text-right font-nimbli-heading text-sm font-bold text-white ring-1 ring-white/15 sm:text-lg">
              {hint}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!speechSupported}
            onClick={() => setSpeechMuted((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-nimbli-ink shadow-lg transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-kind-green-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={speechMuted ? 'Zet voorlezen aan' : 'Zet voorlezen uit'}
          >
            {speechMuted ? (
              <VolumeX className="size-5" aria-hidden />
            ) : (
              <Volume2 className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </header>

      <main className="relative min-h-svh flex-1 overflow-hidden bg-black">
        {error ? (
          <p className="absolute left-1/2 top-1/2 z-40 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-kind-border bg-kind-white px-6 py-5 text-center font-nimbli-heading text-2xl font-bold text-kind-red shadow-2xl sm:text-3xl">
            {error}
          </p>
        ) : null}

        <div className="absolute inset-0 overflow-hidden bg-black">
          <div className="relative size-full scale-x-[-1]">
            <video ref={videoRef} className="block size-full object-cover" playsInline muted />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 size-full object-cover"
              aria-hidden
            />
          </div>

          {showRoutineOverlay ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/25 via-transparent to-black/50 px-3 pb-3 pt-18 text-center sm:px-4 sm:pb-4 sm:pt-20">
              <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-2">
                <div className="rounded-full bg-kind-yellow px-3.5 py-1 font-nimbli-heading text-sm font-black tabular-nums text-nimbli-ink shadow-lg ring-1 ring-white/40 sm:text-base">
                  {poseUi.repsCompleted} / {poseUi.repsTarget} herhalingen
                </div>
                <svg viewBox="0 0 100 4" className="h-2 w-full max-w-md text-kind-yellow" aria-hidden>
                  <rect x="0" y="0" width="100" height="3" rx="1.5" className="fill-white/25" />
                  <rect
                    x="0"
                    y="0"
                    width={pct(poseUi.sessionProgress01 ?? 0)}
                    height="3"
                    rx="1.5"
                    className="fill-current"
                  />
                </svg>
              </div>
              <div className="mx-auto flex w-full max-w-2xl flex-col justify-end rounded-2xl bg-kind-white/92 px-3.5 py-3 text-nimbli-ink shadow-xl ring-1 ring-white/40 backdrop-blur-sm sm:px-5 sm:py-4">
                <p className="font-nimbli-heading text-[clamp(1.25rem,2.5vw,2.1rem)] font-black leading-none tracking-tight text-nimbli-ink">
                  {overlayCopy.title}
                </p>
                <p className="mx-auto mt-1.5 max-w-xl font-nimbli-body text-[clamp(0.8rem,1.2vw,1rem)] font-bold leading-snug text-[#364153]">
                  {overlayCopy.subtitle}
                </p>
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between gap-3 font-nimbli-heading text-[11px] font-black text-[#364153] sm:text-sm">
                    <span>{overlayCopy.progressLabel}</span>
                    <span className="tabular-nums">{Math.round(pct(poseUi.phaseProgress01 ?? poseUi.progress ?? 0))}%</span>
                  </div>
                  <svg
                    viewBox="0 0 100 6"
                    className={cn(
                      'h-3 w-full text-kind-green-primary',
                      (poseUi.phase === 'between_reps' || poseUi.phase === 'complete') && 'text-kind-yellow'
                    )}
                    aria-hidden
                  >
                    <rect x="0" y="0" width="100" height="6" rx="3" className="fill-[#e1dbd3]" />
                    <rect
                      x="0"
                      y="0"
                      width={pct(poseUi.phaseProgress01 ?? poseUi.progress ?? 0)}
                      height="6"
                      rx="3"
                      className="fill-current"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ) : hint && !error ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25 px-6 text-center">
              <p className="rounded-[24px] bg-kind-white/95 px-5 py-4 font-nimbli-heading text-[clamp(1.25rem,3vw,2.4rem)] font-black text-nimbli-ink shadow-2xl ring-2 ring-white/30">
                {hint}
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
