import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { withChildSearch } from '@/lib/activeChild.js'
import { isOuderInstellingenPath } from '@/lib/ouder/ouderInstellingenNav.js'
import { Calendar, ChevronDown, LayoutDashboard, LogOut, Settings, Sparkles } from 'lucide-react'
import NimbliSidebarLogo from '@/components/NimbliSidebarLogo.jsx'
import { cn } from '@/lib/utils'

function handleNavClick(onNavigate) {
  onNavigate?.()
}
import {
  SIDEBAR_BTN_FOCUS,
  SIDEBAR_BTN_HOVER,
  SIDEBAR_BTN_INTERACTION,
  SIDEBAR_BTN_PRESS,
  SIDEBAR_ICON_BTN_PRESS,
} from '@/lib/sidebarButtonInteraction.js'

const navItemClass = ({ isActive, disabled }) =>
  cn(
    'flex w-full items-center gap-3.5 rounded-md border bg-white px-3.5 py-3 font-nimbli-heading text-sm font-bold text-nimbli-ink outline-none',
    disabled
      ? 'cursor-not-allowed border-nimbli-canvas opacity-60 shadow-[0_2px_0_0_#e1dbd3]'
      : cn(
          SIDEBAR_BTN_INTERACTION,
          SIDEBAR_BTN_HOVER,
          SIDEBAR_BTN_PRESS,
          SIDEBAR_BTN_FOCUS,
          isActive
            ? 'border-nimbli shadow-[0_1.5px_0_0_#1e7a6a] active:shadow-[0_1px_0_0_#1e7a6a]'
            : 'border-nimbli-canvas shadow-[0_2px_0_0_#e1dbd3]'
        )
  )

function NavIcon({ Icon, isActive }) {
  const IconComponent = Icon
  return (
    <IconComponent
      className={cn('size-[26px] shrink-0', isActive ? 'text-nimbli' : 'text-nimbli-ink')}
      aria-hidden
    />
  )
}

export default function OuderSidebar({
  logout,
  logoutLoading,
  childrenList = null,
  selectedChildId = null,
  onSelectChild = null,
  onNavigate = null,
  isDrawer = false,
  className,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const instellingenActive = isOuderInstellingenPath(location.pathname)
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  // Optional child-switch support (wired from parent pages).
  const children = childrenList

  const selectedChild = useMemo(() => {
    if (!Array.isArray(children) || !selectedChildId) return null
    return children.find((c) => c?.id === selectedChildId) ?? null
  }, [children, selectedChildId])

  const headerLabel = useMemo(() => {
    if (selectedChild) {
      const name = `${selectedChild?.firstname ?? ''} ${selectedChild?.lastname ?? ''}`.trim()
      return name || 'Kind'
    }
    return 'Ouder'
  }, [selectedChild])

  const hasMultipleChildren = Array.isArray(children) && children.length > 1
  const headerOpensPicker = hasMultipleChildren

  useEffect(() => {
    function onDocPointerDown(e) {
      if (!open) return
      const el = rootRef.current
      if (!el) return
      if (el.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [open])

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[#e5e7eb] bg-white px-6 pt-6 pb-6',
        isDrawer ? 'h-full w-full border-r-0' : 'hidden h-svh w-[260px] shrink-0 lg:flex',
        className
      )}
    >
      <div className="relative mx-auto w-full max-w-[173px]" ref={rootRef}>
        <button
          type="button"
          onClick={() => {
            if (headerOpensPicker) setOpen((v) => !v)
          }}
          disabled={!headerOpensPicker}
          className={cn(
            'flex h-[30px] w-full items-center justify-center gap-2 overflow-hidden rounded-md border border-[#f9fafb] bg-white px-2 text-left shadow-[0_2px_0_0_#e1dbd3]',
            headerOpensPicker
              ? cn(SIDEBAR_BTN_INTERACTION, SIDEBAR_BTN_HOVER, SIDEBAR_BTN_PRESS, SIDEBAR_BTN_FOCUS)
              : cn('cursor-default', SIDEBAR_BTN_FOCUS)
          )}
          aria-haspopup={headerOpensPicker ? 'menu' : undefined}
          aria-expanded={headerOpensPicker ? open : undefined}
        >
          <span className="truncate font-nimbli-heading text-sm font-bold text-[#1a1a1a]">
            {headerLabel}
          </span>
          {headerOpensPicker ? (
            <ChevronDown className="size-3 shrink-0 text-[#1a1a1a]" aria-hidden />
          ) : null}
        </button>

        {open && hasMultipleChildren ? (
          <div
            role="menu"
            aria-label="Kies kind"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-xl border border-[#e5e7eb] bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          >
            {children.map((c) => {
              const name = `${c?.firstname ?? ''} ${c?.lastname ?? ''}`.trim() || 'Kind'
              const active = c?.id === selectedChildId
              return (
                <button
                  key={c.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    const nextId = c?.id ?? null
                    if (!nextId || nextId === selectedChildId) return
                    onSelectChild?.(nextId)
                    onNavigate?.()
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left text-sm',
                    SIDEBAR_BTN_INTERACTION,
                    SIDEBAR_BTN_HOVER,
                    SIDEBAR_BTN_PRESS,
                    SIDEBAR_BTN_FOCUS,
                    active ? 'border-kind-blue/25 bg-[#ebf4fb] text-nimbli' : 'text-[#1a1a1a]'
                  )}
                >
                  <span className="truncate font-nimbli-heading font-bold">{name}</span>
                  {active ? <span className="text-xs font-bold">Actief</span> : null}
                </button>
              )
            })}
          </div>
        ) : null}

        {selectedChild ? (
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
              navigate(withChildSearch('/dashboard/kind', selectedChildId))
            }}
            className={cn(
              'mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-nimbli-canvas bg-[#f0faf7] px-2 py-1.5 font-nimbli-heading text-xs font-bold text-nimbli',
              SIDEBAR_BTN_INTERACTION,
              SIDEBAR_BTN_HOVER,
              SIDEBAR_BTN_PRESS,
              SIDEBAR_BTN_FOCUS
            )}
          >
            <Sparkles className="size-3.5 shrink-0" aria-hidden />
            Kindweergave
          </button>
        ) : null}
      </div>

      <NimbliSidebarLogo className="mt-6" />

      <nav className="mt-10 flex flex-col gap-3" aria-label="Navigatie ouder">
        <NavLink
          to={withChildSearch('/dashboard/ouder', selectedChildId)}
          end
          className={({ isActive }) => navItemClass({ isActive })}
          onClick={() => handleNavClick(onNavigate)}
        >
          {({ isActive }) => (
            <>
              <NavIcon Icon={LayoutDashboard} isActive={isActive} />
              Dashboard
            </>
          )}
        </NavLink>
        <NavLink
          to={withChildSearch('/dashboard/ouder/oefenplanning', selectedChildId)}
          className={({ isActive }) => navItemClass({ isActive })}
          onClick={() => handleNavClick(onNavigate)}
        >
          {({ isActive }) => (
            <>
              <NavIcon Icon={Calendar} isActive={isActive} />
              Oefenplanning
            </>
          )}
        </NavLink>
        <NavLink
          to={withChildSearch('/dashboard/ouder/instellingen', selectedChildId)}
          className={() => navItemClass({ isActive: instellingenActive })}
          onClick={() => handleNavClick(onNavigate)}
        >
          {() => (
            <>
              <NavIcon Icon={Settings} isActive={instellingenActive} />
              Instellingen
            </>
          )}
        </NavLink>
      </nav>

      <div className="mt-auto flex items-center justify-between pt-8">
        <button
          type="button"
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md text-nimbli',
            SIDEBAR_BTN_INTERACTION,
            SIDEBAR_BTN_HOVER,
            SIDEBAR_ICON_BTN_PRESS,
            SIDEBAR_BTN_FOCUS,
            'disabled:pointer-events-none disabled:opacity-60'
          )}
          onClick={() => void logout()}
          disabled={logoutLoading}
          aria-label={logoutLoading ? 'Bezig met uitloggen' : 'Uitloggen'}
        >
          <LogOut className="size-5 rotate-180" strokeWidth={2} />
        </button>
      </div>

    </aside>
  )
}

