import { CheckCircle2 } from 'lucide-react'

export default function OuderRecentRow({ title, time, xp }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-white px-3 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <CheckCircle2 className="size-4 shrink-0 text-[#22c55e]" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[#1a1a1a]">{title}</p>
          <p className="mt-0.5 text-[10px] text-[#6b7280]">{time}</p>
        </div>
      </div>
      <span className="rounded-full bg-nimbli px-2.5 py-1 text-[10px] font-black text-[#faf5ee]">
        +{xp} XP
      </span>
    </div>
  )
}

