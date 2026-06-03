import { Star, Trophy, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KIND_OVERVIEW_STATS } from '@/lib/kind/kindOverviewMock.js'
import { useKindProfileStats } from '@/hooks/kind/useKindProfileStats.js'

function StatItem({ icon, value, className }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-full ${className}`}
      >
        {icon}
      </div>
      <p className="font-nimbli-body text-lg leading-[25.2px] text-kind-black">{value}</p>
    </div>
  )
}

export default function KindOverviewStats({ className }) {
  const { trophies, stars } = KIND_OVERVIEW_STATS
  const { totalXp, loading } = useKindProfileStats()
  const xpDisplay = loading ? '…' : totalXp

  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-6', className)}>
      <StatItem
        value={xpDisplay}
        className="bg-kind-purple"
        icon={<Zap className="size-[25px] text-kind-white" strokeWidth={2.25} aria-hidden />}
      />
    </div>
  )
}
