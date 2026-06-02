import { useMemo } from 'react'
import KindSidebar from '@/components/kind/KindSidebar.jsx'
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
    <div className="flex h-svh overflow-hidden bg-kind-canvas" data-page="kind-overzicht">
      <KindSidebar displayName={displayName} active="overzicht" />

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-[960px] px-6 py-8 sm:px-8 sm:py-10">
          <header>
            <h1 className="font-nimbli-heading text-4xl font-extrabold leading-10 text-kind-black">
              Overzicht
            </h1>
          </header>

          <div className="mt-8 flex flex-col gap-6">
            <KindOverviewProfileCard />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
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
        </div>
      </main>
    </div>
  )
}
