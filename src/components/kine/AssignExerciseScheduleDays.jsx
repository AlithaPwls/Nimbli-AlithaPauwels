import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EXERCISE_SCHEDULE_DAYS,
  defaultExerciseScheduleDays,
  normalizeScheduleDays,
  scheduleDaysSummary,
  toggleScheduleDay,
} from '@/lib/kine/exerciseScheduleDays.js'

function PresetButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-9 rounded-lg border border-[#e1dbd3] bg-white px-3 text-xs font-semibold text-nimbli-muted',
        'transition-colors hover:border-nimbli/40 hover:bg-nimbli/5 hover:text-nimbli-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      {children}
    </button>
  )
}

export default function AssignExerciseScheduleDays({
  value,
  onChange,
  disabled = false,
  error = null,
}) {
  const days = normalizeScheduleDays(value)
  const summary = scheduleDaysSummary(days)
  const sundayOff = !days.includes(6)

  function setDays(next) {
    onChange?.(normalizeScheduleDays(next))
  }

  return (
    <div className="rounded-2xl border border-[#e1dbd3] bg-white p-4">
      <div className="flex items-start gap-2">
        <div
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-nimbli/10 text-nimbli"
          aria-hidden
        >
          <CalendarDays className="size-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-nimbli-ink">Planningsdagen</p>
          <p className="mt-0.5 text-xs leading-snug text-nimbli-muted">
            Kies op welke dagen deze oefening moet worden uitgevoerd.
          </p>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Dagen van de week"
      >
        {EXERCISE_SCHEDULE_DAYS.map((day) => {
          const selected = days.includes(day.index)
          return (
            <button
              key={day.index}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={day.label}
              title={day.label}
              onClick={() => setDays(toggleScheduleDay(days, day.index))}
              className={cn(
                'flex min-h-11 min-w-11 flex-1 items-center justify-center rounded-xl border-2 px-2',
                'font-nimbli-heading text-sm font-bold transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'border-nimbli bg-nimbli/10 text-nimbli'
                  : 'border-[#e1dbd3] bg-nimbli-canvas/40 text-nimbli-muted hover:border-nimbli/30 hover:bg-white'
              )}
            >
              {day.short}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <PresetButton
          disabled={disabled}
          onClick={() => setDays(defaultExerciseScheduleDays())}
        >
          Ma–Za
        </PresetButton>
        <PresetButton disabled={disabled} onClick={() => setDays([0, 1, 2, 3, 4])}>
          Ma–Vr
        </PresetButton>
        <PresetButton
          disabled={disabled}
          onClick={() => setDays(EXERCISE_SCHEDULE_DAYS.map((d) => d.index))}
        >
          Elke dag
        </PresetButton>
      </div>

      <p className="mt-3 text-xs text-nimbli-muted">
        <span className="font-semibold text-nimbli-ink">{summary}</span>
        {sundayOff ? (
          <span className="text-nimbli-muted"> · Zondag uitgeschakeld (rustdag)</span>
        ) : null}
      </p>

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
