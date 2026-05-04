import { Award, ChevronDown, LogOut, Star, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/useLogout.js'

function SidebarItem({ active, Icon, iconClassName, children, onClick }) {
  const IconComponent = Icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[44px] w-full items-center gap-3 rounded-[6px] border px-3 py-2.5 text-left',
        'transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary/40',
        active
          ? 'border-[#2bb39b] border-[1.5px] bg-kind-white shadow-[0_1.5px_0_0_#1e7a6a]'
          : 'border border-[#f9fafb] bg-kind-white shadow-[0_2px_0_0_#e1dbd3]'
      )}
    >
      <IconComponent className={cn('size-[22px] shrink-0', iconClassName)} aria-hidden />
      <span className="font-nimbli-heading text-[15px] font-bold leading-none text-kind-black">{children}</span>
    </button>
  )
}

export default function KindSidebar({ displayName = 'Kind', active = 'oefeningen', onNavigate }) {
  const { logout, loading: logoutLoading } = useLogout()

  return (
    <aside className="flex h-svh w-[216px] shrink-0 flex-col border-r-2 border-[#e5e7eb] bg-kind-white px-6 py-3 font-nimbli-body text-nimbli-ink">
      <div className="flex h-[30px] w-full max-w-[173px] items-center justify-center gap-2 overflow-hidden rounded-[6px] border border-[#f9fafb] bg-kind-white px-2">
        <p className="truncate font-nimbli-heading text-sm font-normal text-kind-black">{displayName}</p>
        <ChevronDown className="size-3 shrink-0 text-kind-black" aria-hidden />
      </div>

      <p className="mt-10 font-nimbli-heading text-2xl font-black tracking-tight text-kind-green-primary">nimbli</p>

      <nav className="mt-8 flex w-full max-w-[173px] flex-col gap-4" aria-label="Navigatie kind">
        <SidebarItem
          active={active === 'oefeningen'}
          Icon={Star}
          iconClassName="fill-kind-red text-kind-red"
          onClick={() => onNavigate?.('oefeningen')}
        >
          Oefeningen
        </SidebarItem>
        <SidebarItem
          active={active === 'overzicht'}
          Icon={Trophy}
          iconClassName="text-kind-yellow"
          onClick={() => onNavigate?.('overzicht')}
        >
          Overzicht
        </SidebarItem>
        <SidebarItem
          active={active === 'profiel'}
          Icon={Award}
          iconClassName="text-kind-blue"
          onClick={() => onNavigate?.('profiel')}
        >
          Mijn profiel
        </SidebarItem>
      </nav>

      <div className="mt-auto pt-8">
        <button
          type="button"
          className="inline-flex size-[30px] items-center justify-center rounded-md text-kind-green-primary transition-colors hover:bg-kind-canvas disabled:opacity-60"
          onClick={() => void logout()}
          disabled={logoutLoading}
          aria-label={logoutLoading ? 'Bezig met uitloggen' : 'Uitloggen'}
        >
          <LogOut className="size-[30px] rotate-180" strokeWidth={2} />
        </button>
      </div>
    </aside>
  )
}
