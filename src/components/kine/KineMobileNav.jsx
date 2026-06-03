import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import NimbliSidebarLogo from '@/components/NimbliSidebarLogo.jsx'
import KineSidebarNav from '@/components/kine/KineSidebarNav.jsx'
import { cn } from '@/lib/utils'
import { useScrollNavbarVisibility } from '@/hooks/useScrollNavbarVisibility.js'

const MOBILE_NAV_QUERY = '(max-width: 1023px)'

export default function KineMobileNav({ scrollEl }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(false)
  const scrollVisible = useScrollNavbarVisibility(scrollEl, { enabled: scrollEnabled })
  const navbarVisible = scrollVisible || drawerOpen

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_NAV_QUERY)

    function syncScrollEnabled() {
      setScrollEnabled(mediaQuery.matches)
    }

    syncScrollEnabled()
    mediaQuery.addEventListener('change', syncScrollEnabled)
    return () => mediaQuery.removeEventListener('change', syncScrollEnabled)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') setDrawerOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  function closeDrawer() {
    setDrawerOpen(false)
  }

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-40 shrink-0 overflow-hidden bg-white transition-[max-height] duration-300 ease-out lg:hidden',
          navbarVisible
            ? 'max-h-[calc(3.5rem+env(safe-area-inset-top,0px))] border-b border-[#e5e7eb]'
            : 'max-h-0 border-b-0'
        )}
      >
        <header
          className="flex h-14 items-center gap-3 px-4 pt-[env(safe-area-inset-top,0px)]"
          aria-label="Mobiele navigatie kinesist"
        >
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-nimbli-ink transition-colors hover:bg-nimbli-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
          aria-expanded={drawerOpen}
          aria-controls="kine-mobile-drawer"
          aria-label={drawerOpen ? 'Menu sluiten' : 'Menu openen'}
          onClick={() => setDrawerOpen((open) => !open)}
        >
          {drawerOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
        <Link
          to="/dashboard/kine"
          className="rounded-md no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
          onClick={closeDrawer}
        >
          <NimbliSidebarLogo className="mx-0 w-24 max-w-[120px]" />
        </Link>
        </header>
      </div>

      <button
        type="button"
        aria-label="Menu sluiten"
        className={cn(
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 lg:hidden',
          drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeDrawer}
        tabIndex={drawerOpen ? 0 : -1}
      />

      <aside
        id="kine-mobile-drawer"
        aria-hidden={!drawerOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-[#e5e7eb] bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1.5rem+env(safe-area-inset-top,0px))] transition-transform duration-300 ease-out lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard/kine"
            className="rounded-md no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
            onClick={closeDrawer}
          >
            <NimbliSidebarLogo className="mx-0 w-28 max-w-[140px]" />
          </Link>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md text-nimbli-muted transition-colors hover:bg-nimbli-canvas hover:text-nimbli-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
            aria-label="Menu sluiten"
            onClick={closeDrawer}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <KineSidebarNav className="mt-10 flex-1" onNavigate={closeDrawer} />
      </aside>
    </>
  )
}
