import { Check, Gift, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function DayDot({ state, label }) {
  const base = 'grid size-7 place-items-center rounded-full'

  if (state === 'fail') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className={cn(base, 'bg-kind-red text-kind-white ring-1 ring-black/5')}>
          <X className="size-3.5" aria-hidden />
        </div>
        <span className="font-nimbli-body text-[10px] text-kind-black">{label}</span>
      </div>
    )
  }
  if (state === 'ok') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className={cn(base, 'bg-[#81c784] text-kind-white ring-1 ring-black/5')}>
          <Check className="size-3.5" aria-hidden />
        </div>
        <span className="font-nimbli-body text-[10px] text-kind-black">{label}</span>
      </div>
    )
  }
  if (state === 'today') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={cn(
            base,
            'border-[3px] border-solid border-kind-yellow bg-transparent ring-1 ring-black/5'
          )}
        />
        <span className="font-nimbli-heading text-[10px] font-black text-kind-yellow">{label}</span>
      </div>
    )
  }
  if (state === 'gift') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={cn(
            base,
            'border border-[#bdbdbd] bg-[rgba(229,231,235,0.87)] text-kind-gray ring-1 ring-black/5'
          )}
        >
          <Gift className="size-3.5" aria-hidden />
        </div>
        <span className="font-nimbli-body text-[10px] text-kind-black">{label}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(base, 'border border-[#bdbdbd] bg-[rgba(229,231,235,0.87)] ring-1 ring-black/5')}
      />
      <span className="font-nimbli-body text-[10px] text-kind-black">{label}</span>
    </div>
  )
}

export default function KindWeekOverview({
  noCard = false,
  days = [
    { label: 'M', state: 'fail' },
    { label: 'D', state: 'ok' },
    { label: 'W', state: 'ok' },
    { label: 'D', state: 'today' },
    { label: 'V', state: 'empty' },
    { label: 'Z', state: 'empty' },
    { label: 'Z', state: 'gift' },
  ],
}) {
  const inner = (
    <>
      <p className="font-nimbli-body text-xs text-kind-black">Weekoverzicht</p>
      <div className="mt-1.5 flex w-full items-start justify-between gap-0.5">
        {days.map((d, idx) => (
          <DayDot key={`${d.label}-${idx}`} state={d.state} label={d.label} />
        ))}
      </div>
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
