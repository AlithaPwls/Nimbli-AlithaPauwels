import { useKindOverviewWeekChart } from '@/hooks/kind/useKindOverviewWeekChart.js'
import { cn } from '@/lib/utils'

function barFillClass(done, total) {
  if (!total || done <= 0) return 'h-0'
  const ratio = done / total
  if (ratio >= 1) return 'h-full'
  if (ratio >= 0.8) return 'h-4/5'
  if (ratio >= 0.6) return 'h-3/5'
  if (ratio >= 0.4) return 'h-2/5'
  if (ratio >= 0.2) return 'h-1/5'
  return 'h-[8%]'
}

function WeekBar({ label, date, done, total }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <span className="font-nimbli-body text-[10px] font-semibold text-[#9ca3af]">
        {done}/{total}
      </span>
      <div className="relative flex h-32 w-full max-w-14 items-end overflow-hidden rounded-[10px] bg-kind-light-gray">
        <div
          className={cn(
            'w-full rounded-t-[10px] bg-gradient-to-b from-kind-blue to-[#6392bf]',
            barFillClass(done, total)
          )}
        />
      </div>
      <div className="flex flex-col items-center">
        <span className="font-nimbli-heading text-xs font-bold text-[#6b7280]">{label}</span>
        <span className="font-nimbli-body text-[9px] leading-none text-[#9ca3af]">{date}</span>
      </div>
    </div>
  )
}

export default function KindOverviewWeekChart() {
  const { bars, loading, error } = useKindOverviewWeekChart()

  return (
    <section className="rounded-lg border-2 border-kind-border bg-kind-white px-[25px] pb-6 pt-[25px] shadow-[0_2px_0_0_#e1dbd3]">
      <h2 className="font-nimbli-heading text-lg font-bold leading-[25.2px] text-[#1a1a1a]">
        Weekoverzicht
      </h2>

      {error ? (
        <p className="mt-4 text-sm text-kind-red" role="alert">
          Weekoverzicht laden mislukt.
        </p>
      ) : null}

      <div className="mt-5 flex min-h-[175px] items-end justify-between gap-1">
        {loading ? (
          <p className="w-full py-8 text-center text-sm text-kind-gray">Weekoverzicht laden…</p>
        ) : (
          bars.map((day) => <WeekBar key={day.key} label={day.label} date={day.date} done={day.done} total={day.total} />)
        )}
      </div>
    </section>
  )
}
