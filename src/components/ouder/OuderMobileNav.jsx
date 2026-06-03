import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { withChildSearch } from '@/lib/activeChild.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import { cn } from '@/lib/utils'
import { useScrollNavbarVisibility } from '@/hooks/useScrollNavbarVisibility.js'

const MOBILE_NAV_QUERY = '(max-width: 1023px)'

export default function OuderMobileNav({
  scrollEl,
  logout,
  logoutLoading,
  childrenList,
  selectedChildId,
  onSelectChild,
  headerLabel = 'Ouder',
}) {
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
          aria-label="Mobiele navigatie ouder"
        >
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-nimbli-ink transition-colors hover:bg-nimbli-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
            aria-expanded={drawerOpen}
            aria-controls="ouder-mobile-drawer"
            aria-label={drawerOpen ? 'Menu sluiten' : 'Menu openen'}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
          <Link
            to={withChildSearch('/dashboard/ouder', selectedChildId)}
            className="min-w-0 flex-1 truncate rounded-md font-nimbli-heading text-base font-bold text-[#1a1a1a] no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
            onClick={closeDrawer}
          >
            {headerLabel}
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
        id="ouder-mobile-drawer"
        aria-hidden={!drawerOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] transition-transform duration-300 ease-out lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <OuderSidebar
          logout={logout}
          logoutLoading={logoutLoading}
          childrenList={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={onSelectChild}
          onNavigate={closeDrawer}
          isDrawer
          className="pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1.5rem+env(safe-area-inset-top,0px))]"
        />
      </aside>
    </>
  )
}
