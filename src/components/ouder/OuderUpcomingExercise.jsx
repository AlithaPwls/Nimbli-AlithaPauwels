import { Clock, Repeat2 } from 'lucide-react'
import { categoryToneClasses } from '@/lib/exerciseDisplay.js'
import { cn } from '@/lib/utils'

function MetaDot() {
  return <span className="size-1 shrink-0 rounded-full bg-[#9ca3af]" aria-hidden />
}

export default function OuderUpcomingExercise({
  title,
  focus,
  categoryTone = 'default',
  reps,
  minutes,
  imageUrl,
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-3 py-3">
      <div className="size-10 shrink-0 overflow-hidden rounded-md bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#1a1a1a]">{title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#6b7280]">
          <span
            className={cn(
              'inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold',
              categoryToneClasses(categoryTone)
            )}
          >
            {focus}
          </span>
          {reps != null ? (
            <>
              <MetaDot />
              <span className="inline-flex items-center gap-1 text-[#6b7280]">
                <Repeat2 className="size-3 shrink-0" aria-hidden />
                {reps}
              </span>
            </>
          ) : null}
          {minutes != null ? (
            <>
              <MetaDot />
              <span className="inline-flex items-center gap-1 text-[#6b7280]">
                <Clock className="size-3 shrink-0" aria-hidden />
                {minutes} min
              </span>
            </>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="inline-flex h-7 shrink-0 items-center justify-center rounded bg-nimbli px-3 font-nimbli-heading text-[10px] font-black text-[#faf5ee] shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:opacity-95"
      >
        Start
      </button>
    </div>
  )
}
