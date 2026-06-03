import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import KindSidebar from '@/components/kind/KindSidebar.jsx'
import { cn } from '@/lib/utils'
import { useScrollNavbarVisibility } from '@/hooks/useScrollNavbarVisibility.js'

const MOBILE_NAV_QUERY = '(max-width: 1023px)'

export default function KindMobileNav({ scrollEl, displayName, active }) {
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
          'sticky top-0 z-40 shrink-0 overflow-hidden bg-kind-white transition-[max-height] duration-300 ease-out lg:hidden',
          navbarVisible
            ? 'max-h-[calc(3.5rem+env(safe-area-inset-top,0px))] border-b-2 border-[#e5e7eb]'
            : 'max-h-0 border-b-0'
        )}
      >
        <header
          className="flex h-14 items-center gap-3 px-4 pt-[env(safe-area-inset-top,0px)]"
          aria-label="Mobiele navigatie kind"
        >
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-nimbli-ink transition-colors hover:bg-kind-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-yellow focus-visible:ring-offset-2"
          aria-expanded={drawerOpen}
          aria-controls="kind-mobile-drawer"
          aria-label={drawerOpen ? 'Menu sluiten' : 'Menu openen'}
          onClick={() => setDrawerOpen((open) => !open)}
        >
          {drawerOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
        <p className="min-w-0 truncate font-nimbli-heading text-base font-bold text-kind-black">{displayName}</p>
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
        id="kind-mobile-drawer"
        aria-hidden={!drawerOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] transition-transform duration-300 ease-out lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <KindSidebar
          displayName={displayName}
          active={active}
          onClose={closeDrawer}
          className="h-full w-full border-r-0 px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))]"
        />
      </aside>
    </>
  )
}
