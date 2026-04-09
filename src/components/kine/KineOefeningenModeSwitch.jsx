import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function KineOefeningenModeSwitch() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-[12px] border border-nimbli bg-white px-1.5 py-1"
      role="tablist"
      aria-label="Oefeningen-weergave"
    >
      <NavLink
        to="/dashboard/kine/oefeningen"
        end
        className={({ isActive }) =>
          cn(
            'flex h-10 items-center px-6 font-nimbli-heading text-sm font-bold transition-colors',
            isActive
              ? 'rounded-[12px] bg-nimbli text-white shadow-[0_2px_0_0_#1e7a6a]'
              : 'rounded-[16px] text-[#302d2d] hover:bg-nimbli/5'
          )
        }
      >
        Bibliotheek
      </NavLink>
      <NavLink
        to="/dashboard/kine/oefeningen/eigen"
        className={({ isActive }) =>
          cn(
            'flex h-10 items-center px-6 font-nimbli-heading text-sm font-bold transition-colors',
            isActive
              ? 'rounded-[12px] bg-nimbli text-white shadow-[0_2px_0_0_#1e7a6a]'
              : 'rounded-[16px] text-[#302d2d] hover:bg-nimbli/5'
          )
        }
      >
        Eigen video&apos;s
      </NavLink>
    </div>
  )
}
