import { useMemo } from 'react'
import KindSidebar from '@/components/kind/KindSidebar.jsx'
import KindProgressPath from '@/components/kind/KindProgressPath.jsx'
import KindSummaryCard from '@/components/kind/KindSummaryCard.jsx'
import { useAuth } from '@/hooks/useAuth.js'

export default function DashboardKind() {
  const { profile } = useAuth()

  const displayName = useMemo(() => {
    const first = profile?.firstname?.trim()
    const last = profile?.lastname?.trim()
    const combined = [first, last].filter(Boolean).join(' ')
    return combined || 'Kind'
  }, [profile?.firstname, profile?.lastname])

  return (
    <div className="flex h-svh overflow-hidden bg-kind-canvas" data-page="kind-dashboard">
      <KindSidebar displayName={displayName} active="oefeningen" />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row lg:gap-[88px] lg:pl-0">
        <main className="relative min-h-0 w-full shrink-0 overflow-y-auto overflow-x-hidden bg-kind-canvas lg:w-[464px] lg:max-w-[464px]">
          <KindProgressPath monthLabel="Januari" />
          <div className="flex justify-end border-t border-[#e5e7eb] px-4 py-6 lg:hidden">
            <KindSummaryCard className="w-full max-w-[362px]" />
          </div>
        </main>

        <aside className="relative hidden h-full min-h-0 w-[362px] shrink-0 flex-col items-end justify-start gap-10 self-stretch pt-6 pr-6 lg:flex lg:pt-10">
          <KindSummaryCard className="shrink-0" />
        </aside>
      </div>
    </div>
  )
}
