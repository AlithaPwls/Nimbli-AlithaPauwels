import { Trash2 } from 'lucide-react'
import ExerciseScheduleDayChips from '@/components/kine/ExerciseScheduleDayChips.jsx'
import { Button } from '@/components/ui/button'
import { categoryToneClasses } from '@/lib/exerciseDisplay.js'
import { normalizeScheduleDays } from '@/lib/kine/exerciseScheduleDays.js'
import { cn } from '@/lib/utils'

const statPillClass =
  'inline-flex items-center gap-1 rounded-md bg-[#f9fafb] px-2 py-1 font-nimbli-body text-[11px] font-semibold text-nimbli-muted ring-1 ring-[#e1dbd3]/80'

export default function KinePatientExerciseRow({
  exercise,
  deleting = false,
  deleteDisabled = false,
  onDelete,
}) {
  const canDelete = Boolean(onDelete) && !deleteDisabled
  const scheduleDays = normalizeScheduleDays(exercise.scheduleDays ?? exercise.schedule_days)

  return (
    <article className="rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3] max-sm:p-3">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15 sm:size-24">
          <img
            src={exercise.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:gap-3">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-nimbli-heading text-base font-bold leading-snug text-nimbli-ink line-clamp-2 sm:text-lg sm:line-clamp-none">
                {exercise.title}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
                <span
                  className={cn(
                    'inline-flex h-5 items-center rounded-full px-2 text-[10px] sm:text-xs',
                    categoryToneClasses(exercise.categoryTone)
                  )}
                >
                  {exercise.category}
                </span>
                <span className="hidden text-nimbli-muted sm:inline" aria-hidden>
                  •
                </span>
                <span className="text-[11px] text-nimbli-ink sm:text-xs">{exercise.difficulty}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              disabled={!canDelete || deleting}
              onClick={() => onDelete?.(exercise)}
              aria-label={`Verwijder ${exercise.title}`}
              className="size-8 shrink-0 sm:size-9"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
            <span className={statPillClass}>
              <span aria-hidden>↻</span>
              {exercise.reps}
            </span>
            <span className={statPillClass}>
              <span aria-hidden>⏱</span>
              {exercise.time}
            </span>
          </div>

          <div className="hidden flex-wrap items-center gap-3 text-xs text-nimbli-muted sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>↻</span>
              {exercise.reps}
            </span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>⏱</span>
              {exercise.time}
            </span>
          </div>

          <div className="-mx-0.5 min-w-0 max-sm:overflow-x-auto max-sm:pb-0.5 max-sm:[-ms-overflow-style:auto] max-sm:[scrollbar-width:thin] sm:mx-0 sm:overflow-visible sm:pb-0">
            <ExerciseScheduleDayChips
              value={scheduleDays}
              readOnly
              className="max-sm:flex-nowrap max-sm:gap-1 sm:mt-2"
              chipClassName="max-sm:min-w-8 max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[10px]"
            />
          </div>
        </div>
      </div>
    </article>
  )
}
