import { useMemo } from 'react'
import KindSidebar from '@/components/kind/KindSidebar.jsx'
import KindProgressPath from '@/components/kind/KindProgressPath.jsx'
import KindSummaryCard from '@/components/kind/KindSummaryCard.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'

export default function DashboardKind() {
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
    <div className="flex h-svh overflow-hidden bg-kind-canvas" data-page="kind-dashboard">
      <KindSidebar displayName={displayName} active="oefeningen" />

      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden lg:flex-row">
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-kind-canvas">
          <div className="flex w-full min-w-0 flex-1 flex-col items-stretch px-4 pt-4 lg:justify-start lg:px-8 lg:pt-8 xl:px-10">
            <KindProgressPath />
          </div>
          <div className="flex justify-end border-t border-[#e5e7eb] px-4 py-6 lg:hidden">
            <KindSummaryCard className="w-full max-w-[362px]" />
          </div>
        </main>

        <aside className="relative hidden h-full min-h-0 w-[362px] shrink-0 flex-col justify-start gap-10 self-stretch pt-6 pr-8 lg:flex lg:pt-10 lg:pr-10 xl:pr-14">
          <KindSummaryCard className="shrink-0" />
        </aside>
      </div>
    </div>
  )
}
