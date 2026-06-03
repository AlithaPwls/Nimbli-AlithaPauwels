import { LogOut, Star, Trophy, ChevronDown } from 'lucide-react'
import NimbliSidebarLogo from '@/components/NimbliSidebarLogo.jsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/useLogout.js'
import { useAuth } from '@/hooks/useAuth.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'
import { useSwitchToParentDashboard } from '@/hooks/useSwitchToParentDashboard.js'
import ParentPasswordDialog from '@/components/ParentPasswordDialog.jsx'
import { CHILD_PROFILE_SWITCH_COPY, useParentPasswordGate } from '@/hooks/useParentPasswordGate.js'
import { readActiveChildId, withChildSearch, writeActiveChildId } from '@/lib/activeChild.js'
import {
  SIDEBAR_BTN_FOCUS,
  SIDEBAR_BTN_HOVER,
  SIDEBAR_BTN_INTERACTION,
  SIDEBAR_BTN_PRESS,
  SIDEBAR_ICON_BTN_PRESS,
} from '@/lib/sidebarButtonInteraction.js'

function SidebarItem({ active, Icon, iconClassName, children, onClick }) {
  const IconComponent = Icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-[44px] w-full items-center gap-3 rounded-[6px] border px-3 py-2.5 text-left',
        SIDEBAR_BTN_INTERACTION,
        SIDEBAR_BTN_HOVER,
        SIDEBAR_BTN_PRESS,
        SIDEBAR_BTN_FOCUS,
        active
          ? 'border-[#2bb39b] border-[1.5px] bg-kind-white shadow-[0_1.5px_0_0_#1e7a6a] active:shadow-[0_1px_0_0_#1e7a6a]'
          : 'border border-[#f9fafb] bg-kind-white shadow-[0_2px_0_0_#e1dbd3]'
      )}
    >
      <IconComponent className={cn('size-[22px] shrink-0', iconClassName)} aria-hidden />
      <span className="font-nimbli-heading text-[15px] font-bold leading-none text-kind-black">{children}</span>
    </button>
  )
}

const KIND_ROUTES = {
  oefeningen: '/dashboard/kind',
  overzicht: '/dashboard/kind/overzicht',
}

export default function KindSidebar({ displayName = 'Kind', active = 'oefeningen', onNavigate, onClose, className }) {
  const { logout, loading: logoutLoading } = useLogout()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { role, profile } = useAuth()
  const { childId, children: linkedChildren } = useActiveChildId()

  const [childMenuOpen, setChildMenuOpen] = useState(false)
  const childMenuRef = useRef(null)

  const isParentView = role === 'parent'
  const childList = Array.isArray(linkedChildren) ? linkedChildren : []
  const hasMultipleChildren = childList.length > 1

  const childSearchSuffix = childId ? readActiveChildId(searchParams) || childId : null

  const parentSwitch = useSwitchToParentDashboard(childSearchSuffix)
  const childSwitchGate = useParentPasswordGate()

  const activeChild = useMemo(() => {
    if (!childId) return null
    return childList.find((c) => c?.id === childId) ?? null
  }, [childId, childList])

  const headerLabel = useMemo(() => {
    if (activeChild?.firstname) {
      return activeChild.firstname.trim()
    }
    return displayName
  }, [activeChild, displayName])

  const canLeaveKindView = isParentView || (role === 'child' && Boolean(profile?.id))

  function goTo(section) {
    const path = KIND_ROUTES[section]
    if (!path) return
    const target = isParentView && childSearchSuffix
      ? withChildSearch(path, childSearchSuffix)
      : path
    if (onNavigate) {
      onNavigate(section)
      return
    }
    navigate(target)
    onClose?.()
  }

  const applyChildSelection = useCallback(
    (id) => {
      if (!id) return
      writeActiveChildId(id)
      const next = new URLSearchParams(searchParams)
      next.set('child', id)
      setSearchParams(next, { replace: true })
      setChildMenuOpen(false)
      const path = KIND_ROUTES[active] ?? '/dashboard/kind'
      navigate(isParentView ? withChildSearch(path, id) : path, { replace: true })
      onClose?.()
    },
    [active, isParentView, navigate, onClose, searchParams, setSearchParams]
  )

  function requestChildSwitch(id) {
    if (!id || id === childId) return
    childSwitchGate.runProtected(() => {
      if (isParentView) {
        applyChildSelection(id)
        return
      }
      navigate(withChildSearch('/dashboard/kind', id))
      onClose?.()
    }, CHILD_PROFILE_SWITCH_COPY)
  }

  useEffect(() => {
    function onDocPointerDown(e) {
      if (!childMenuOpen) return
      const el = childMenuRef.current
      if (!el?.contains(e.target)) setChildMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [childMenuOpen])

  function handleHeaderClick() {
    if (hasMultipleChildren) {
      setChildMenuOpen((v) => !v)
      return
    }
    if (canLeaveKindView) {
      parentSwitch.requestSwitch()
    }
  }

  function handleGoToParentDashboard() {
    setChildMenuOpen(false)
    onClose?.()
    parentSwitch.requestSwitch()
  }

  const isDrawer = Boolean(onClose)

  return (
    <aside
      className={cn(
        'flex h-svh w-[216px] shrink-0 flex-col border-r-2 border-[#e5e7eb] bg-kind-white px-6 py-3 font-nimbli-body text-nimbli-ink',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-1 flex-col',
          isDrawer ? 'mx-auto w-full max-w-[200px] items-stretch' : 'w-full'
        )}
      >
        <div className={cn('relative w-full', !isDrawer && 'mx-auto max-w-[173px]')} ref={childMenuRef}>
          <button
            type="button"
            onClick={handleHeaderClick}
            className={cn(
              'flex h-[30px] w-full items-center justify-center gap-1 overflow-hidden rounded-[6px] border border-[#f9fafb] bg-kind-white px-2',
              SIDEBAR_BTN_INTERACTION,
              SIDEBAR_BTN_HOVER,
              SIDEBAR_BTN_PRESS,
              SIDEBAR_BTN_FOCUS,
              'shadow-[0_2px_0_0_#e1dbd3]'
            )}
            aria-haspopup={hasMultipleChildren ? 'menu' : undefined}
            aria-expanded={hasMultipleChildren ? childMenuOpen : undefined}
            aria-label={
              hasMultipleChildren
                ? 'Kies kind of ga naar ouderdashboard'
                : 'Ga naar ouderdashboard'
            }
          >
            <span className="truncate font-nimbli-heading text-sm font-normal text-kind-black">
              {headerLabel}
            </span>
            {hasMultipleChildren ? <ChevronDown className="size-3 shrink-0" aria-hidden /> : null}
          </button>

          {childMenuOpen && hasMultipleChildren ? (
            <div
              role="menu"
              aria-label="Kies kind"
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-xl border border-[#e5e7eb] bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
            >
              {childList.map((c) => {
                const name = `${c?.firstname ?? ''} ${c?.lastname ?? ''}`.trim() || 'Kind'
                const activeChildRow = c?.id === childId
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="menuitem"
                    onClick={() => requestChildSwitch(c.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left text-sm',
                      SIDEBAR_BTN_INTERACTION,
                      SIDEBAR_BTN_HOVER,
                      SIDEBAR_BTN_PRESS,
                      SIDEBAR_BTN_FOCUS,
                      activeChildRow ? 'border-kind-blue/25 bg-[#ebf4fb] text-nimbli' : 'text-[#1a1a1a]'
                    )}
                  >
                    <span className="truncate font-nimbli-heading font-bold">{name}</span>
                    {activeChildRow ? <span className="text-xs font-bold">Actief</span> : null}
                  </button>
                )
              })}
              <button
                type="button"
                role="menuitem"
                onClick={handleGoToParentDashboard}
                className={cn(
                  'mt-1 flex w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm font-nimbli-heading font-bold text-nimbli',
                  SIDEBAR_BTN_INTERACTION,
                  SIDEBAR_BTN_HOVER,
                  SIDEBAR_BTN_PRESS,
                  SIDEBAR_BTN_FOCUS
                )}
              >
                Naar ouderdashboard
              </button>
            </div>
          ) : null}
        </div>

        <ParentPasswordDialog
          open={parentSwitch.open}
          onOpenChange={parentSwitch.setOpen}
          title={parentSwitch.dialogCopy.title}
          description={parentSwitch.dialogCopy.description}
          password={parentSwitch.password}
          onPasswordChange={parentSwitch.setPassword}
          error={parentSwitch.error}
          loading={parentSwitch.loading}
          canVerify={parentSwitch.canSwitch}
          onSubmit={() => void parentSwitch.confirmSwitch()}
          inputId="kind-switch-parent-password"
        />

        <ParentPasswordDialog
          open={childSwitchGate.open}
          onOpenChange={childSwitchGate.setOpen}
          title={childSwitchGate.dialogCopy.title}
          description={childSwitchGate.dialogCopy.description}
          password={childSwitchGate.password}
          onPasswordChange={childSwitchGate.setPassword}
          error={childSwitchGate.error}
          loading={childSwitchGate.loading}
          canVerify={childSwitchGate.canVerify}
          onSubmit={() => void childSwitchGate.confirm()}
          inputId="kind-switch-child-password"
        />

        <NimbliSidebarLogo className={cn('mt-10', isDrawer && 'mx-auto')} />

        <nav
          className={cn('mt-8 flex w-full flex-col gap-4', !isDrawer && 'max-w-[173px]')}
          aria-label="Navigatie kind"
        >
          <SidebarItem
            active={active === 'oefeningen'}
            Icon={Star}
            iconClassName="fill-kind-red text-kind-red"
            onClick={() => goTo('oefeningen')}
          >
            Oefeningen
          </SidebarItem>
          <SidebarItem
            active={active === 'overzicht'}
            Icon={Trophy}
            iconClassName="text-kind-yellow"
            onClick={() => goTo('overzicht')}
          >
            Overzicht
          </SidebarItem>
        </nav>

        <div className="mt-auto pt-8">
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
      </div>
    </aside>
  )
}
