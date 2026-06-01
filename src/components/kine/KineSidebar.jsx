import { Link, NavLink } from 'react-router-dom'
import { Calendar, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import NimbliSidebarLogo from '@/components/NimbliSidebarLogo.jsx'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/useLogout.js'
import {
  SIDEBAR_BTN_FOCUS,
  SIDEBAR_BTN_HOVER,
  SIDEBAR_BTN_INTERACTION,
  SIDEBAR_BTN_PRESS,
  SIDEBAR_ICON_BTN_PRESS,
} from '@/lib/sidebarButtonInteraction.js'

const navItemClass = ({ isActive }) =>
  cn(
    'flex w-full items-center gap-3.5 rounded-md border bg-white px-3.5 py-3 font-nimbli-heading text-sm font-bold text-nimbli-ink outline-none',
    SIDEBAR_BTN_INTERACTION,
    SIDEBAR_BTN_HOVER,
    SIDEBAR_BTN_PRESS,
    SIDEBAR_BTN_FOCUS,
    isActive
      ? 'border-nimbli shadow-[0_1.5px_0_0_#1e7a6a] active:shadow-[0_1px_0_0_#1e7a6a]'
      : 'border-nimbli-canvas shadow-[0_2px_0_0_#e1dbd3]'
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

export default function KineSidebar() {
  const { logout, loading: logoutLoading } = useLogout()

  return (
    <aside
      className="sticky top-0 flex h-svh w-[220px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white px-6 pt-8 pb-6"
      aria-label="Hoofdnavigatie kinesist"
    >
      <Link
        to="/dashboard/kine"
        className="block rounded-md no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
      >
        <NimbliSidebarLogo />
      </Link>

      <nav className="mt-14 flex flex-col gap-3" aria-label="Secties">
        <NavLink to="/dashboard/kine" end className={navItemClass}>
          {({ isActive }) => (
            <>
              <NavIcon Icon={LayoutDashboard} isActive={isActive} />
              Dashboard
            </>
          )}
        </NavLink>
        <NavLink to="/dashboard/kine/oefeningen" className={navItemClass}>
          {({ isActive }) => (
            <>
              <NavIcon Icon={Calendar} isActive={isActive} />
              Oefeningen
            </>
          )}
        </NavLink>
        <NavLink to="/dashboard/kine/instellingen" className={navItemClass}>
          {({ isActive }) => (
            <>
              <NavIcon Icon={Settings} isActive={isActive} />
              Instellingen
            </>
          )}
        </NavLink>
      </nav>

      <div className="mt-auto pt-8">
        <button
          type="button"
          className={cn(
            'inline-flex size-[30px] items-center justify-center rounded-md text-nimbli',
            SIDEBAR_BTN_INTERACTION,
            SIDEBAR_BTN_HOVER,
            SIDEBAR_ICON_BTN_PRESS,
            SIDEBAR_BTN_FOCUS,
            'disabled:pointer-events-none disabled:opacity-60'
          )}
          disabled={logoutLoading}
          onClick={() => void logout()}
          aria-label={logoutLoading ? 'Bezig met uitloggen' : 'Uitloggen'}
        >
          <LogOut className="size-[30px] rotate-180" strokeWidth={2} />
        </button>
      </div>
    </aside>
  )
}
