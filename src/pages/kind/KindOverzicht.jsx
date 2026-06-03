import { useMemo } from 'react'
import KindDashboardShell from '@/components/kind/KindDashboardShell.jsx'
import KindOverviewProfileCard from '@/components/kind/KindOverviewProfileCard.jsx'
import KindDailyMissionsCard from '@/components/kind/KindDailyMissionsCard.jsx'
import KindBadgesCard from '@/components/kind/KindBadgesCard.jsx'
import KindStreakCard from '@/components/kind/KindStreakCard.jsx'
import KindOverviewWeekChart from '@/components/kind/KindOverviewWeekChart.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'

export default function KindOverzicht() {
  const { role, profile } = useAuth()
  const { childId, children } = useActiveChildId()

  const displayName = useMemo(() => {
    if (role === 'parent' && childId) {
      const active = (children ?? []).find((c) => c?.id === childId)
      const first = active?.firstname?.trim()
      if (first) return first
    }
    const first = profile?.firstname?.trim()
    const last = profile?.lastname?.trim()
    const combined = [first, last].filter(Boolean).join(' ')
    return combined || 'Kind'
  }, [role, childId, children, profile?.firstname, profile?.lastname])

  return (
    <KindDashboardShell displayName={displayName} active="overzicht" dataPage="kind-overzicht">
      <div className="mx-auto w-full min-w-0 max-w-[960px] px-8 py-10 max-lg:px-4 max-lg:py-6">
        <header>
          <h1 className="font-nimbli-heading text-4xl font-extrabold leading-10 text-kind-black max-lg:text-3xl max-sm:text-2xl">
            Overzicht
          </h1>
        </header>

        <div className="mt-8 flex flex-col gap-6 max-lg:mt-6 max-lg:gap-5">
          <KindOverviewProfileCard />

          <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1 max-lg:gap-6">
            <div className="flex flex-col gap-6 max-lg:gap-5">
              <KindDailyMissionsCard />
              <KindStreakCard />
            </div>
            <div className="flex flex-col gap-6 max-lg:gap-5">
              <KindBadgesCard />
              <KindOverviewWeekChart />
            </div>
          </div>
        </div>
      </div>
    </KindDashboardShell>
  )
}
