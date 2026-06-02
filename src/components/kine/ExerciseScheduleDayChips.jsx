import {
  EXERCISE_SCHEDULE_DAYS,
  normalizeScheduleDays,
  scheduleDaysSummary,
  toggleScheduleDay,
} from '@/lib/kine/exerciseScheduleDays.js'
import { cn } from '@/lib/utils'

const chipBase =
  'inline-flex min-w-9 items-center justify-center rounded-lg border-2 px-2 py-1 font-nimbli-heading text-[11px] font-bold transition-colors duration-200'

/**
 * Weekday chips (Ma–Zo). Interactive by default; set readOnly for display-only (patient detail).
 */
export default function ExerciseScheduleDayChips({
  value,
  onChange,
  readOnly = false,
  className,
  'aria-label': ariaLabel,
}) {
  const days = normalizeScheduleDays(value)
  const summary = scheduleDaysSummary(days)

  return (
    <div
      className={cn('flex flex-wrap gap-1.5', className)}
      role="list"
      aria-label={ariaLabel ?? `Uitvoeren op: ${summary}`}
    >
      {EXERCISE_SCHEDULE_DAYS.map((day) => {
        const active = days.includes(day.index)

        if (readOnly) {
          return (
            <span
              key={day.index}
              role="listitem"
              title={day.label}
              aria-current={active ? 'true' : undefined}
              className={cn(
                chipBase,
                active
                  ? 'border-nimbli/25 bg-nimbli/10 text-nimbli'
                  : 'border-[#e1dbd3] bg-[#f9fafb] text-[#9ca3af]'
              )}
            >
              {day.short}
            </span>
          )
        }

        return (
          <button
            key={day.index}
            type="button"
            role="listitem"
            aria-pressed={active}
            aria-label={day.label}
            title={day.label}
            onClick={(e) => {
              e.stopPropagation()
              onChange?.(toggleScheduleDay(days, day.index))
            }}
            className={cn(
              chipBase,
              'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
              active
                ? 'border-nimbli bg-nimbli/10 text-nimbli'
                : 'border-[#e1dbd3] bg-[#f9fafb] text-[#9ca3af] hover:border-nimbli/30 hover:bg-white'
            )}
          >
            {day.short}
          </button>
        )
      })}
    </div>
  )
}
