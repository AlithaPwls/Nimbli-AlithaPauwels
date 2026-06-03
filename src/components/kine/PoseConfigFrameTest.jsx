import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { checkPoseConfigAgainstCaptures } from '@/lib/kind/poseConfigCaptureCheck.js'

/**
 * Shows whether generated pose_config passes on the captured rest/target video frames.
 */
export default function PoseConfigFrameTest({ poseConfig, capturedLandmarks }) {
  const result = useMemo(() => {
    if (!poseConfig || !capturedLandmarks?.rest || !capturedLandmarks?.target) {
      return null
    }
    return checkPoseConfigAgainstCaptures(poseConfig, capturedLandmarks)
  }, [poseConfig, capturedLandmarks])

  if (!result) return null

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-[#e1dbd3] bg-white p-3"
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-semibold text-nimbli-ink">Test op vastgelegde frames</p>
      <ul className="flex flex-col gap-1.5 text-[11px] leading-snug text-nimbli-muted">
        <FrameRow
          label="Doelframe (oefening)"
          ok={result.target.ok}
          reason={result.target.reason}
        />
        <FrameRow label="Rustframe" ok={result.rest.ok} reason={result.rest.reason} />
      </ul>
      {result.ok ? (
        <p className="inline-flex items-center gap-1 text-xs font-semibold text-nimbli">
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          Pose-logica past bij je video — klaar om op te slaan.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
            <AlertTriangle className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            Logica klopt niet met je frames — genereer opnieuw of pas frames aan.
          </p>
          {result.errors.length > 0 ? (
            <ul className="list-inside list-disc text-[11px] text-amber-900/90">
              {result.errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  )
}

function FrameRow({ label, ok, reason }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-nimbli" strokeWidth={2} aria-hidden />
      ) : (
        <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" strokeWidth={2} aria-hidden />
      )}
      <span>
        <span className="font-medium text-nimbli-ink">{label}:</span>{' '}
        {ok ? 'geslaagd' : 'mislukt'}
        {!ok && reason ? <span className="block text-[10px] text-nimbli-muted">{reason}</span> : null}
      </span>
    </li>
  )
}
