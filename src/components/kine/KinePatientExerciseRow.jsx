import { CalendarDays, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { categoryToneClasses } from '@/lib/exerciseDisplay.js'
import {
  EXERCISE_SCHEDULE_DAYS,
  normalizeScheduleDays,
  scheduleDaysSummary,
} from '@/lib/kine/exerciseScheduleDays.js'
import { cn } from '@/lib/utils'

export default function KinePatientExerciseRow({
  exercise,
  deleting = false,
  deleteDisabled = false,
  onDelete,
}) {
  const canDelete = Boolean(onDelete) && !deleteDisabled
  const scheduleDays = normalizeScheduleDays(exercise.scheduleDays ?? exercise.schedule_days)
  const scheduleSummary = scheduleDaysSummary(scheduleDays)

  return (
    <article className="rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3]">
      <div className="flex items-start gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
          <img
            src={exercise.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-nimbli-heading text-lg font-bold text-nimbli-ink">{exercise.title}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span
                className={[
                  'inline-flex h-5 items-center rounded-full px-2 text-xs',
                  categoryToneClasses(exercise.categoryTone),
                ].join(' ')}
              >
                {exercise.category}
              </span>
              <span className="text-nimbli-muted" aria-hidden>
                •
              </span>
              <span className="text-xs text-nimbli-ink">{exercise.difficulty}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-nimbli-muted">
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

            <div className="mt-3">
              <div
                className="mt-2 flex flex-wrap gap-1.5"
                role="list"
                aria-label={`Uitvoeren op: ${scheduleSummary}`}
              >
                {EXERCISE_SCHEDULE_DAYS.map((day) => {
                  const active = scheduleDays.includes(day.index)
                  return (
                    <span
                      key={day.index}
                      role="listitem"
                      title={day.label}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'inline-flex min-w-9 items-center justify-center rounded-lg border-2 px-2 py-1',
                        'font-nimbli-heading text-[11px] font-bold',
                        active
                          ? 'border-nimbli/25 bg-nimbli/10 text-nimbli'
                          : 'border-[#e1dbd3] bg-[#f9fafb] text-[#9ca3af]'
                      )}
                    >
                      {day.short}
                    </span>
                  )
                })}
              </div>
           
            </div>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="icon"
            disabled={!canDelete || deleting}
            onClick={() => onDelete?.(exercise)}
            aria-label={`Verwijder ${exercise.title}`}
            className="self-start"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  )
}
