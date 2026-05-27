import { Flame } from 'lucide-react'
import { KIND_STREAK_DAYS } from '@/lib/kind/kindOverviewMock.js'

export default function KindStreakCard() {
  return (
    <section className="rounded-lg border-2 border-kind-border bg-kind-white px-6 py-6 shadow-[0_2px_0_0_#e1dbd3]">
      <h2 className="font-nimbli-heading text-lg font-bold leading-[25.2px] text-[#302d2d]">
        Huidige Streak
      </h2>

      <div className="mt-7 flex h-[82px] items-center justify-between rounded-lg border border-kind-border bg-kind-white px-6 py-2 shadow-[0_4px_2px_rgba(0,0,0,0.25)]">
        <div className="flex items-baseline gap-1 text-kind-blue">
          <span className="font-nimbli-heading text-4xl font-bold leading-10">{KIND_STREAK_DAYS}</span>
          <span className="font-nimbli-heading text-lg font-bold leading-7">dagen</span>
        </div>
        <div className="grid size-[52px] place-items-center rounded-full bg-kind-blue px-3">
          <Flame className="size-[26px] text-kind-white" strokeWidth={2.25} aria-hidden />
        </div>
      </div>
    </section>
  )
}
