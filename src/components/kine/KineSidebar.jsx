import { Link, NavLink } from 'react-router-dom'
import { Calendar, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useLogout.js'

const navItemClass = ({ isActive }) =>
  cn(
    'flex w-full items-center gap-3.5 rounded-md border bg-white px-3.5 py-3 font-nimbli-heading text-sm font-bold text-nimbli-ink transition-colors outline-none',
    'shadow-[0_2px_0_0_#e1dbd3] focus-visible:ring-2 focus-visible:ring-nimbli/40',
    isActive
      ? 'border-nimbli shadow-[0_1px_0_0_#1e7a6a]'
      : 'border-nimbli-canvas hover:border-nimbli-canvas/80'
  )

function NavIcon({ Icon, isActive }) {
  return (
    <Icon
      className={cn('size-[26px] shrink-0', isActive ? 'text-nimbli' : 'text-nimbli-ink')}
      aria-hidden
    />
  )
}

export default function KineSidebar() {
  const { logout, loading: logoutLoading } = useLogout()

  return (
    <aside
      className="flex h-svh w-[220px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white px-6 pt-8 pb-6"
      aria-label="Hoofdnavigatie kinesist"
    >
      <Link
        to="/dashboard/kine"
        className="font-nimbli-heading text-2xl font-bold tracking-tight text-nimbli no-underline hover:opacity-90"
      >
        nimbli
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-nimbli hover:bg-nimbli-canvas hover:text-nimbli"
          disabled={logoutLoading}
          onClick={() => void logout()}
          aria-label={logoutLoading ? 'Bezig met uitloggen' : 'Uitloggen'}
        >
          <LogOut className="size-[30px] rotate-180" strokeWidth={2} />
        </Button>
      </div>
    </aside>
  )
}
