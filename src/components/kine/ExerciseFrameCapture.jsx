import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ScanLine,
  TriangleAlert,
} from 'lucide-react'
import { DrawingUtils, PoseLandmarker } from '@mediapipe/tasks-vision'
import {
  captureVideoFrame,
  normalizeLandmarks,
  seekToTime,
  summarizeVisibility,
} from '@/lib/kind/poseImageDetection.js'
import { usePoseImageLandmarker } from '@/hooks/kine/usePoseImageLandmarker.js'

const FRAME_STEP_SEC = 1 / 30
const VISIBILITY_WARN_THRESHOLD = 28
const VISIBILITY_NAMES_PREVIEW = 6

function formatSeconds(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  const mm = Math.floor(total / 60)
  const ss = total % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

/**
 * Video preview + frame capture inside a kinesiologist's "new exercise" dialog.
 *
 * `slot` and `slotLabel` allow rendering multiple capture sections (e.g. one
 * for the rest pose and one for the target pose) above the same uploaded video.
 *
 * @param {{
 *   videoUrl: string,
 *   videoFileName: string,
 *   slot?: 'rest' | 'target',
 *   slotLabel?: string,
 *   onLandmarksCaptured: (payload: object) => void,
 *   onClear: () => void,
 * }} props
 */
export default function ExerciseFrameCapture({
  videoUrl,
  videoFileName,
  slot,
  slotLabel = 'Pose uit video',
  onLandmarksCaptured,
  onClear,
}) {
  const baseId = useId()
  const sliderId = `${baseId}-frame-time`

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const { detect } = usePoseImageLandmarker()

  const clearOverlay = useCallback(() => {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const drawOverlay = useCallback((result) => {
    const canvas = overlayRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const groups = result?.landmarks
    if (!Array.isArray(groups) || groups.length === 0) return
    const drawingUtils = new DrawingUtils(ctx)
    for (const landmarks of groups) {
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { lineWidth: 2 })
      drawingUtils.drawLandmarks(landmarks, { radius: 3 })
    }
  }, [])

  const [videoReady, setVideoReady] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const [status, setStatus] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [pointCount, setPointCount] = useState(0)
  const [lastPayload, setLastPayload] = useState(null)
  const [visibilitySummary, setVisibilitySummary] = useState(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return undefined

    let cancelled = false
    setVideoReady(false)
    setDuration(0)
    setCurrentTime(0)
    setStatus(null)
    setErrorMessage(null)
    setPointCount(0)
    setVisibilitySummary(null)
    clearOverlay()

    function onLoadedMetadata() {
      if (cancelled) return
      const d = Number.isFinite(video.duration) ? video.duration : 0
      setDuration(d)
    }

    async function primeForSafari() {
      try {
        video.muted = true
        video.playsInline = true
        await video.play()
        video.pause()
        video.currentTime = 0
      } catch {
        // Autoplay may be blocked; seeking still works on most browsers.
      }
      if (!cancelled) setVideoReady(true)
    }

    function onLoadedData() {
      if (cancelled) return
      void primeForSafari()
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('loadeddata', onLoadedData)
    video.src = videoUrl
    video.load()

    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('loadeddata', onLoadedData)
    }
  }, [videoUrl, clearOverlay])

  const handleSliderChange = useCallback(
    (next) => {
      const video = videoRef.current
      if (!video) return
      const max = Number.isFinite(duration) && duration > 0 ? duration : 0
      const safe = Number.isFinite(next) ? Math.min(max, Math.max(0, next)) : 0
      setCurrentTime(safe)
      try {
        video.currentTime = safe
      } catch {
        // Some browsers throw if seeking before metadata is ready.
      }
      clearOverlay()
    },
    [clearOverlay, duration]
  )

  const stepFrame = useCallback(
    (direction) => {
      handleSliderChange(currentTime + direction * FRAME_STEP_SEC)
    },
    [currentTime, handleSliderChange]
  )

  const handleAnalyze = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setCapturing(true)
    setStatus(null)
    setErrorMessage(null)
    setPointCount(0)
    setLastPayload(null)
    setVisibilitySummary(null)
    clearOverlay()

    try {
      await seekToTime(video, currentTime)
      captureVideoFrame(video, canvas)
      const result = await detect(canvas)

      const payload = normalizeLandmarks(result, {
        videoFileName: videoFileName || 'video.mp4',
        frameTimeSec: currentTime,
        imageWidth: video.videoWidth,
        imageHeight: video.videoHeight,
      })

      if (!payload) {
        setStatus('no_person')
        return
      }

      drawOverlay(result)
      setPointCount(payload.pose.landmarks.length)
      setLastPayload(payload)
      setVisibilitySummary(summarizeVisibility(payload))
      setStatus('ok')
      onLandmarksCaptured(payload)
    } catch (e) {
      setStatus('error')
      setErrorMessage(
        e instanceof Error && e.message ? e.message : 'Frame analyseren mislukt.'
      )
    } finally {
      setCapturing(false)
    }
  }, [clearOverlay, currentTime, detect, drawOverlay, onLandmarksCaptured, videoFileName])

  const handleClear = useCallback(() => {
    setStatus(null)
    setErrorMessage(null)
    setPointCount(0)
    setLastPayload(null)
    setVisibilitySummary(null)
    clearOverlay()
    onClear?.()
  }, [clearOverlay, onClear])

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border border-[#e1dbd3] bg-white p-4"
      data-slot={slot}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-nimbli-heading text-sm font-bold text-nimbli-ink">
          {slotLabel}
        </h3>
        <span className="text-[11px] text-nimbli-muted">
          Kies een frame en analyseer de houding.
        </span>
      </header>

      <div className="relative overflow-hidden rounded-md bg-black">
        <video
          ref={videoRef}
          className="mx-auto block max-h-[220px] w-full object-contain"
          playsInline
          muted
          preload="auto"
        />
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 mx-auto block size-full object-contain"
          aria-hidden
        />
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={sliderId} className="text-xs font-medium tabular-nums text-nimbli-ink">
          {formatSeconds(currentTime)} / {formatSeconds(duration)}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="1 frame terug"
            onClick={() => stepFrame(-1)}
            disabled={!videoReady || currentTime <= 0}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#e1dbd3] bg-white text-nimbli-ink transition-colors duration-200 motion-reduce:transition-none hover:bg-nimbli-canvas/80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30"
          >
            <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden />
          </button>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={Number.isFinite(duration) && duration > 0 ? duration : 0}
            step={FRAME_STEP_SEC}
            value={currentTime}
            disabled={!videoReady || duration <= 0}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-nimbli-canvas accent-nimbli disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            aria-label="1 frame vooruit"
            onClick={() => stepFrame(1)}
            disabled={!videoReady || currentTime >= duration}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#e1dbd3] bg-white text-nimbli-ink transition-colors duration-200 motion-reduce:transition-none hover:bg-nimbli-canvas/80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30"
          >
            <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!videoReady || capturing}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-transparent bg-nimbli px-4 text-sm font-bold text-nimbli-foreground shadow-[0_1px_0_0_var(--color-nimbli-shadow)] transition-colors duration-200 motion-reduce:transition-none hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ScanLine className="size-4" strokeWidth={2} aria-hidden />
          {capturing ? 'Analyseren…' : 'Frame analyseren'}
        </button>

        {status === 'ok' ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-[#e1dbd3] bg-white px-3 text-xs font-semibold text-nimbli-ink transition-colors duration-200 motion-reduce:transition-none hover:bg-nimbli-canvas/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30"
          >
            <RotateCcw className="size-3.5" strokeWidth={2.25} aria-hidden />
            Opnieuw kiezen
          </button>
        ) : null}
      </div>

      {status === 'ok' ? (
        <div className="flex flex-col gap-2">
          <p
            className="inline-flex items-center gap-1.5 rounded-md bg-nimbli/10 px-3 py-2 text-xs font-medium text-nimbli-ink"
            role="status"
          >
            <CheckCircle2 className="size-4 text-nimbli" strokeWidth={2} aria-hidden />
            {slotLabel} herkend op {formatSeconds(currentTime)}
            {visibilitySummary
              ? ` (${visibilitySummary.visibleCount}/${visibilitySummary.totalPoints} punten zichtbaar).`
              : ` (${pointCount} punten).`}
          </p>
          {visibilitySummary && visibilitySummary.visibleCount < VISIBILITY_WARN_THRESHOLD ? (
            <div
              className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
              role="status"
            >
              <p className="inline-flex items-center gap-1.5">
                <TriangleAlert className="size-4" strokeWidth={2} aria-hidden />
                Lage zichtbaarheid: slechts {visibilitySummary.visibleCount} van{' '}
                {visibilitySummary.totalPoints} punten goed zichtbaar.
              </p>
              {visibilitySummary.lowVisibilityNames.length > 0 ? (
                <p className="mt-1 text-amber-700">
                  Slecht zichtbaar:{' '}
                  {visibilitySummary.lowVisibilityNames
                    .slice(0, VISIBILITY_NAMES_PREVIEW)
                    .join(', ')}
                  {visibilitySummary.lowVisibilityNames.length > VISIBILITY_NAMES_PREVIEW
                    ? ` +${
                        visibilitySummary.lowVisibilityNames.length - VISIBILITY_NAMES_PREVIEW
                      } meer`
                    : ''}
                  .
                </p>
              ) : null}
            </div>
          ) : null}
          {lastPayload ? (
            <details className="rounded-md border border-[#e1dbd3] bg-nimbli-canvas/40 text-xs">
              <summary className="cursor-pointer select-none px-3 py-2 font-medium text-nimbli-ink hover:bg-nimbli-canvas/70">
                Toon landmarks (JSON)
              </summary>
              <pre className="max-h-64 overflow-auto whitespace-pre px-3 pb-3 font-mono text-[11px] leading-relaxed text-nimbli-ink/90">
                {JSON.stringify(lastPayload, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}

      {status === 'no_person' ? (
        <p
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
          role="status"
        >
          <TriangleAlert className="size-4" strokeWidth={2} aria-hidden />
          Geen persoon herkend. Probeer een ander frame.
        </p>
      ) : null}

      {status === 'error' ? (
        <p
          className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
          role="alert"
        >
          <TriangleAlert className="size-4" strokeWidth={2} aria-hidden />
          {errorMessage || 'Frame analyseren mislukt.'}
        </p>
      ) : null}
    </section>
  )
}
