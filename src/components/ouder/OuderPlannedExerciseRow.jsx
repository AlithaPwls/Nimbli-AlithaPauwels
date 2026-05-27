import { CheckCircle2, Clock, Repeat2 } from 'lucide-react'
import { categoryToneClasses } from '@/lib/exerciseDisplay.js'
import { cn } from '@/lib/utils'

function MetaDot() {
  return <span className="size-1 shrink-0 rounded-full bg-[#9ca3af]" aria-hidden />
}

export default function OuderPlannedExerciseRow({
  title,
  focus,
  categoryTone = 'default',
  reps,
  minutes,
  imageUrl,
  done = false,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#eef2f7] bg-white px-5 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <div className="size-10 shrink-0 overflow-hidden rounded-md bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#0a0a0a]">{title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-nimbli-muted">
            <span
              className={cn(
                'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold',
                categoryToneClasses(categoryTone)
              )}
            >
              {focus}
            </span>
            <MetaDot />
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="size-3.5" aria-hidden />
              {reps}x herhalingen
            </span>
            <MetaDot />
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {minutes} min
            </span>
          </div>
        </div>
      </div>

      {done ? (
        <CheckCircle2 className="size-6 shrink-0 text-[#22c55e]" aria-hidden />
      ) : (
        <span className="size-6 shrink-0" aria-hidden />
      )}
    </div>
  )
}
