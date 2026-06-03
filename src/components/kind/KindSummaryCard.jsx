import { cn } from '@/lib/utils'
import KindDailyMissionsCard from '@/components/kind/KindDailyMissionsCard.jsx'
import KindOverviewStats from '@/components/kind/KindOverviewStats.jsx'
import KindWeekOverview from '@/components/kind/KindWeekOverview.jsx'

export default function KindSummaryCard({ className }) {
  return (
    <section className={cn('flex w-full max-w-[362px] shrink-0 flex-col items-end gap-[41px] max-lg:max-w-none max-lg:gap-8', className)}>
      <div className="max-lg:hidden">
        <KindOverviewStats />
      </div>

      <div
        className={cn(
          'w-full rounded-md border-0 bg-kind-white px-[22px] py-3',
          'shadow-[0px_4px_4px_rgba(0,0,0,0.25),0px_2.8px_0px_0px_#e8eaee]'
        )}
      >
        <KindWeekOverview noCard />
      </div>

      <KindDailyMissionsCard />
    </section>
  )
}
