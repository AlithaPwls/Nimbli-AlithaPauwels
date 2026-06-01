import { Check, Gift, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKindOverviewWeekChart } from '@/hooks/kind/useKindOverviewWeekChart.js'

const DAY_DOT_CIRCLE =
  'kind-week-day-dot grid size-7 place-items-center rounded-full transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:shadow-none'

const DAY_DOT_WRAP =
  'group/day flex cursor-default flex-col items-center gap-1 rounded-md p-0.5 transition-colors duration-200 ease-out motion-reduce:transition-none hover:[&_.kind-week-day-dot]:-translate-y-0.5 hover:[&_.kind-week-day-dot]:shadow-[0_6px_14px_rgba(0,0,0,0.12)] motion-reduce:hover:[&_.kind-week-day-dot]:translate-y-0 motion-reduce:hover:[&_.kind-week-day-dot]:shadow-none'

const DAY_DOT_LABEL =
  'transition-[color,font-weight] duration-200 ease-out motion-reduce:transition-none group-hover/day:font-semibold group-hover/day:text-kind-black'

function DayDotShell({ title, isToday, children }) {
  return (
    <div
      className={cn(DAY_DOT_WRAP, isToday && 'cursor-pointer')}
      title={title}
      {...(isToday ? { 'aria-current': 'date' } : {})}
    >
      {children}
    </div>
  )
}

function DayDotLabels({ label, date, labelClassName, dateClassName }) {
  return (
    <>
      <span className={cn('font-nimbli-body text-[10px] leading-none text-kind-black', DAY_DOT_LABEL, labelClassName)}>
        {label}
      </span>
      <span
        className={cn(
          'font-nimbli-body text-[9px] leading-none text-[#9ca3af] transition-colors duration-200 ease-out group-hover/day:text-[#6b7280] motion-reduce:transition-none',
          dateClassName
        )}
      >
        {date}
      </span>
    </>
  )
}

function DayDot({ state, label, date, done, total, isToday }) {
  const title = `${label} ${date}: ${done}/${total} oefeningen${isToday ? ' (vandaag)' : ''}`

  if (state === 'fail') {
    return (
      <DayDotShell title={title} isToday={isToday}>
        <div className={cn(DAY_DOT_CIRCLE, 'bg-kind-red text-kind-white ring-1 ring-black/5')}>
          <X className="size-3.5 transition-transform duration-200 ease-out group-hover/day:scale-110 motion-reduce:group-hover/day:scale-100 motion-reduce:transition-none" aria-hidden />
        </div>
        <DayDotLabels label={label} date={date} />
      </DayDotShell>
    )
  }
  if (state === 'ok') {
    return (
      <DayDotShell title={title} isToday={isToday}>
        <div className={cn(DAY_DOT_CIRCLE, 'bg-[#81c784] text-kind-white ring-1 ring-black/5')}>
          <Check className="size-3.5 transition-transform duration-200 ease-out group-hover/day:scale-110 motion-reduce:group-hover/day:scale-100 motion-reduce:transition-none" aria-hidden />
        </div>
        <DayDotLabels label={label} date={date} />
      </DayDotShell>
    )
  }
  if (state === 'today') {
    return (
      <DayDotShell title={title} isToday>
        <div
          className={cn(
            DAY_DOT_CIRCLE,
            'border-[3px] border-solid border-kind-yellow bg-transparent ring-1 ring-black/5 group-hover/day:border-[#d4a017]'
          )}
        />
        <DayDotLabels
          label={label}
          date={date}
          labelClassName="font-nimbli-heading font-black text-kind-yellow group-hover/day:text-[#d4a017]"
          dateClassName="font-semibold text-kind-yellow group-hover/day:text-[#d4a017]"
        />
      </DayDotShell>
    )
  }
  if (state === 'gift') {
    return (
      <DayDotShell title={title} isToday={isToday}>
        <div
          className={cn(
            DAY_DOT_CIRCLE,
            'border border-[#bdbdbd] bg-[rgba(229,231,235,0.87)] text-kind-gray ring-1 ring-black/5'
          )}
        >
          <Gift className="size-3.5 transition-transform duration-200 ease-out group-hover/day:scale-110 motion-reduce:group-hover/day:scale-100 motion-reduce:transition-none" aria-hidden />
        </div>
        <DayDotLabels label={label} date={date} />
      </DayDotShell>
    )
  }

  return (
    <DayDotShell title={title} isToday={isToday}>
      <div className={cn(DAY_DOT_CIRCLE, 'border border-[#bdbdbd] bg-[rgba(229,231,235,0.87)] ring-1 ring-black/5')} />
      <DayDotLabels label={label} date={date} />
    </DayDotShell>
  )
}

export default function KindWeekOverview({ noCard = false }) {
  const { weekDays, weekRangeLabel, loading, error } = useKindOverviewWeekChart()

  const inner = (
    <>
      <div className="flex flex-col gap-0.5">
        <p className="font-nimbli-body text-xs font-semibold text-kind-black">Weekoverzicht</p>
        <p className="font-nimbli-body text-[10px] text-[#6b7280]">{weekRangeLabel}</p>
      </div>

      {error ? (
        <p className="mt-2 text-[10px] text-kind-red" role="alert">
          Weekoverzicht laden mislukt.
        </p>
      ) : null}

      {loading ? (
        <p className="mt-3 text-center text-[10px] text-kind-gray">Laden…</p>
      ) : (
        <div
          className="mt-2 flex w-full items-start justify-between gap-0.5"
          role="list"
          aria-label={`Weekoverzicht ${weekRangeLabel}`}
        >
          {weekDays.map((d) => (
            <div key={d.key} role="listitem">
              <DayDot
                state={d.state}
                label={d.label}
                date={d.date}
                done={d.done}
                total={d.total}
                isToday={d.isToday}
              />
            </div>
          ))}
        </div>
      )}
    </>
  )

  if (noCard) {
    return inner
  }

  return (
    <section
      className={cn(
        'rounded-md bg-kind-white px-[22px] py-3',
        'shadow-[0px_4px_4px_rgba(0,0,0,0.25),0px_2.8px_0px_0px_#e8eaee]'
      )}
    >
      {inner}
    </section>
  )
}
