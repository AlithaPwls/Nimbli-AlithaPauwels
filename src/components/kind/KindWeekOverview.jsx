import { Check, Gift, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useKindOverviewWeekChart } from '@/hooks/kind/useKindOverviewWeekChart.js'

function DayDot({ state, label, date, done, total, isToday }) {
  const base = 'grid size-7 place-items-center rounded-full'
  const title = `${label} ${date}: ${done}/${total} oefeningen${isToday ? ' (vandaag)' : ''}`

  if (state === 'fail') {
    return (
      <div className="flex flex-col items-center gap-1" title={title}>
        <div className={cn(base, 'bg-kind-red text-kind-white ring-1 ring-black/5')}>
          <X className="size-3.5" aria-hidden />
        </div>
        <span className="font-nimbli-body text-[10px] leading-none text-kind-black">{label}</span>
        <span className="font-nimbli-body text-[9px] leading-none text-[#9ca3af]">{date}</span>
      </div>
    )
  }
  if (state === 'ok') {
    return (
      <div className="flex flex-col items-center gap-1" title={title}>
        <div className={cn(base, 'bg-[#81c784] text-kind-white ring-1 ring-black/5')}>
          <Check className="size-3.5" aria-hidden />
        </div>
        <span className="font-nimbli-body text-[10px] leading-none text-kind-black">{label}</span>
        <span className="font-nimbli-body text-[9px] leading-none text-[#9ca3af]">{date}</span>
      </div>
    )
  }
  if (state === 'today') {
    return (
      <div className="flex flex-col items-center gap-1" title={title}>
        <div
          className={cn(
            base,
            'border-[3px] border-solid border-kind-yellow bg-transparent ring-1 ring-black/5'
          )}
          aria-current="date"
        />
        <span className="font-nimbli-heading text-[10px] font-black leading-none text-kind-yellow">
          {label}
        </span>
        <span className="font-nimbli-body text-[9px] font-semibold leading-none text-kind-yellow">
          {date}
        </span>
      </div>
    )
  }
  if (state === 'gift') {
    return (
      <div className="flex flex-col items-center gap-1" title={title}>
        <div
          className={cn(
            base,
            'border border-[#bdbdbd] bg-[rgba(229,231,235,0.87)] text-kind-gray ring-1 ring-black/5'
          )}
        >
          <Gift className="size-3.5" aria-hidden />
        </div>
        <span className="font-nimbli-body text-[10px] leading-none text-kind-black">{label}</span>
        <span className="font-nimbli-body text-[9px] leading-none text-[#9ca3af]">{date}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1" title={title}>
      <div
        className={cn(base, 'border border-[#bdbdbd] bg-[rgba(229,231,235,0.87)] ring-1 ring-black/5')}
      />
      <span className="font-nimbli-body text-[10px] leading-none text-kind-black">{label}</span>
      <span className="font-nimbli-body text-[9px] leading-none text-[#9ca3af]">{date}</span>
    </div>
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
