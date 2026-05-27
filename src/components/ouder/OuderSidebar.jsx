import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItemClass = ({ isActive, disabled }) =>
  cn(
    'flex w-full items-center gap-3.5 rounded-md border bg-white px-3.5 py-3 font-nimbli-heading text-sm font-bold text-nimbli-ink transition-colors outline-none',
    'shadow-[0_2px_0_0_#e1dbd3] focus-visible:ring-2 focus-visible:ring-nimbli/40',
    disabled
      ? 'cursor-not-allowed border-nimbli-canvas opacity-60'
      : isActive
        ? 'border-nimbli shadow-[0_1px_0_0_#1e7a6a]'
        : 'border-nimbli-canvas hover:border-nimbli-canvas/80'
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
}) {
  const navigate = useNavigate()
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
    <aside className="flex h-svh w-[260px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white px-6 pt-6 pb-6">
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => {
            // Clicking the active child name should switch to the kind dashboard.
            if (selectedChild) {
              setOpen(false)
              navigate('/dashboard/kind')
              return
            }
            if (Array.isArray(children) && children.length > 1) setOpen((v) => !v)
          }}
          className={cn(
            'flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
            Array.isArray(children) && children.length > 1 ? 'cursor-pointer hover:bg-nimbli-canvas' : 'cursor-default'
          )}
          aria-haspopup={Array.isArray(children) && children.length > 1 ? 'menu' : undefined}
          aria-expanded={Array.isArray(children) && children.length > 1 ? open : undefined}
        >
          <span className="font-nimbli-heading text-sm font-bold text-[#1a1a1a]">
            {headerLabel}
          </span>
          <span className="text-nimbli-muted" aria-hidden>
            ▾
          </span>
        </button>

        {open && Array.isArray(children) && children.length > 1 ? (
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
                    onSelectChild?.(c?.id ?? null)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm',
                    'transition-colors duration-150 motion-reduce:transition-none',
                    active ? 'bg-nimbli/10 text-nimbli' : 'hover:bg-nimbli-canvas text-[#1a1a1a]'
                  )}
                >
                  <span className="truncate font-nimbli-heading font-bold">{name}</span>
                  {active ? <span className="text-xs font-bold">Actief</span> : null}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-6 font-nimbli-heading text-3xl font-black tracking-tight text-nimbli">
        nimbli
      </div>

      <nav className="mt-10 flex flex-col gap-3" aria-label="Navigatie ouder">
        <NavLink
          to="/dashboard/ouder"
          end
          className={({ isActive }) => navItemClass({ isActive })}
        >
          {({ isActive }) => (
            <>
              <NavIcon Icon={LayoutDashboard} isActive={isActive} />
              Dashboard
            </>
          )}
        </NavLink>
        <NavLink
          to="/dashboard/ouder/oefenplanning"
          className={({ isActive }) => navItemClass({ isActive })}
        >
          {({ isActive }) => (
            <>
              <NavIcon Icon={Calendar} isActive={isActive} />
              Oefenplanning
            </>
          )}
        </NavLink>
        <NavLink
          to="/dashboard/ouder/instellingen"
          className={({ isActive }) => navItemClass({ isActive })}
        >
          {({ isActive }) => (
            <>
              <NavIcon Icon={Settings} isActive={isActive} />
              Instellingen
            </>
          )}
        </NavLink>
      </nav>

      <div className="mt-auto flex items-center justify-between pt-8">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-nimbli transition-colors hover:bg-nimbli-canvas disabled:opacity-60"
          onClick={() => void logout()}
          disabled={logoutLoading}
          aria-label={logoutLoading ? 'Bezig met uitloggen' : 'Uitloggen'}
        >
          <LogOut className="size-[28px] rotate-180" strokeWidth={2} />
        </button>
      </div>
    </aside>
  )
}

