import { CheckCircle2, XCircle } from 'lucide-react'

export default function KinePatientSessionRow({ title, time, score, success }) {
  const scoreLabel =
    typeof score === 'number' && Number.isFinite(score) ? `${Math.round(score)}%` : null
  const succeeded = success === true || (scoreLabel != null && Number(score) >= 70)

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 max-sm:px-3 max-sm:py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        {succeeded ? (
          <CheckCircle2 className="size-5 shrink-0 text-[#22c55e]" aria-hidden />
        ) : (
          <XCircle className="size-5 shrink-0 text-[#9ca3af]" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="truncate font-nimbli-heading text-sm font-bold text-nimbli-ink">{title}</p>
          <p className="mt-0.5 text-xs text-nimbli-muted">{time}</p>
        </div>
      </div>
      {scoreLabel ? (
        <span className="shrink-0 rounded-full bg-nimbli/10 px-3 py-1 font-nimbli-heading text-xs font-bold text-nimbli">
          {scoreLabel}
        </span>
      ) : null}
    </div>
  )
}
