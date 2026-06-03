import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const tabClass = ({ isActive }) =>
  cn(
    'flex h-9 flex-1 items-center justify-center px-2 text-center font-nimbli-heading text-xs font-bold transition-colors sm:h-10 sm:flex-none sm:px-6 sm:text-sm',
    isActive
      ? 'rounded-[10px] bg-nimbli text-white shadow-[0_2px_0_0_#1e7a6a] sm:rounded-[12px]'
      : 'rounded-[10px] text-[#302d2d] hover:bg-nimbli/5 sm:rounded-[16px]'
  )

export default function KineOefeningenModeSwitch() {
  return (
    <div
      className="flex w-full min-w-0 items-center gap-1 rounded-[12px] border border-nimbli bg-white p-1 sm:inline-flex sm:w-auto sm:gap-2 sm:px-1.5 sm:pt-1 sm:pb-1.5"
      role="tablist"
      aria-label="Oefeningen-weergave"
    >
      <NavLink to="/dashboard/kine/oefeningen" end className={tabClass}>
        Bibliotheek
      </NavLink>
      <NavLink to="/dashboard/kine/oefeningen/eigen" className={tabClass}>
        Eigen video&apos;s
      </NavLink>
    </div>
  )
}
