import { Trophy, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import KindWeekOverview from '@/components/kind/KindWeekOverview.jsx'

function StatPill({ icon, value, iconClassName }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'grid size-10 place-items-center rounded-full shadow-sm ring-1 ring-black/5',
          iconClassName
        )}
      >
        {icon}
      </div>
      <p className="font-nimbli-body text-lg leading-6 text-kind-black">{value}</p>
    </div>
  )
}

export default function KindSummaryCard({ className }) {
  return (
    <section className={cn('flex w-full max-w-[362px] shrink-0 flex-col items-end gap-[41px]', className)}>
      <div className="flex w-full flex-wrap items-center justify-end gap-6">
        <StatPill
          icon={<Trophy className="size-[25px] text-kind-white" strokeWidth={2.25} aria-hidden />}
          value="3"
          iconClassName="bg-kind-yellow"
        />
        <StatPill
          icon={<Star className="size-[25px] text-kind-white" strokeWidth={2.25} aria-hidden />}
          value="12"
          iconClassName="bg-kind-blue"
        />
        <StatPill
          icon={<Zap className="size-[25px] text-kind-white" strokeWidth={2.25} aria-hidden />}
          value="20"
          iconClassName="bg-kind-purple"
        />
      </div>

      <div
        className={cn(
          'w-full rounded-md border-0 bg-kind-white px-[22px] py-3',
          'shadow-[0px_4px_4px_rgba(0,0,0,0.25),0px_2.8px_0px_0px_#e8eaee]'
        )}
      >
        <KindWeekOverview noCard />
      </div>
    </section>
  )
}
