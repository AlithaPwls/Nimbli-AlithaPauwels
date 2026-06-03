import { useCallback, useState } from 'react'
import KindMobileNav from '@/components/kind/KindMobileNav.jsx'
import KindSidebar from '@/components/kind/KindSidebar.jsx'

export default function KindDashboardShell({ displayName, active, children, aside = null, dataPage }) {
  const [scrollContainer, setScrollContainer] = useState(null)

  const setMainRef = useCallback((node) => {
    setScrollContainer(node)
  }, [])

  return (
    <div className="flex h-svh overflow-hidden bg-kind-canvas" data-page={dataPage}>
      <KindSidebar displayName={displayName} active={active} className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <KindMobileNav scrollEl={scrollContainer} displayName={displayName} active={active} />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <main
            ref={setMainRef}
            className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-kind-canvas"
          >
            {children}
          </main>
          {aside}
        </div>
      </div>
    </div>
  )
}
