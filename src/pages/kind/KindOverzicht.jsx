import { useMemo } from 'react'
import KindSidebar from '@/components/kind/KindSidebar.jsx'
import KindOverviewStats from '@/components/kind/KindOverviewStats.jsx'
import KindDailyMissionsCard from '@/components/kind/KindDailyMissionsCard.jsx'
import KindBadgesCard from '@/components/kind/KindBadgesCard.jsx'
import KindStreakCard from '@/components/kind/KindStreakCard.jsx'
import KindOverviewWeekChart from '@/components/kind/KindOverviewWeekChart.jsx'
import { useAuth } from '@/hooks/useAuth.js'

export default function KindOverzicht() {
  const { profile } = useAuth()

  const displayName = useMemo(() => {
    const first = profile?.firstname?.trim()
    const last = profile?.lastname?.trim()
    const combined = [first, last].filter(Boolean).join(' ')
    return combined || 'Kind'
  }, [profile?.firstname, profile?.lastname])

  return (
    <div className="flex h-svh overflow-hidden bg-kind-canvas" data-page="kind-overzicht">
      <KindSidebar displayName={displayName} active="overzicht" />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-[960px] px-6 py-8 sm:px-8 sm:py-10">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="font-nimbli-heading text-4xl font-extrabold leading-10 text-kind-black">
              Overzicht
            </h1>
            <KindOverviewStats />
          </header>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col gap-6">
              <KindDailyMissionsCard />
              <KindStreakCard />
            </div>
            <div className="flex flex-col gap-6">
              <KindBadgesCard />
              <KindOverviewWeekChart />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
