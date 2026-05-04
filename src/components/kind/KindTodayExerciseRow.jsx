import { cn } from '@/lib/utils'

function MetaDot() {
  return <span className="size-1 shrink-0 rounded-full bg-kind-black" aria-hidden />
}

/**
 * One row in the “oefeningen van vandaag” popover (Figma node 43:1736 / Component 11).
 */
export default function KindTodayExerciseRow({ exercise, onStart }) {
  return (
    <div className="flex items-start gap-2.5 bg-kind-white px-2.5 py-2.5">
      <div className="relative size-8 shrink-0 overflow-hidden rounded-sm ring-1 ring-black/5">
        <img
          src={exercise.image}
          alt=""
          className="absolute inset-0 size-full max-w-none object-cover object-top"
          width={64}
          height={64}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-nimbli-body text-xs font-normal text-[#0a0a0a]">{exercise.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-nimbli-body text-[10px] text-kind-black',
              exercise.categoryClass
            )}
          >
            {exercise.category}
          </span>
          <MetaDot />
          <span className="font-nimbli-body text-[10px] text-kind-black">{exercise.difficulty}</span>
          <MetaDot />
          <span className="font-nimbli-body text-[10px] text-nimbli-ink">{exercise.reps}</span>
        </div>
      </div>
      <button
        type="button"
        className="flex h-[30px] w-[62px] shrink-0 flex-col items-center justify-center rounded-md border-0 bg-kind-green-primary px-2 font-nimbli-heading text-[11px] font-black text-kind-canvas shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:bg-kind-green-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2"
        onClick={() => onStart?.(exercise)}
      >
        <span className="whitespace-nowrap">Start</span>
      </button>
    </div>
  )
}
