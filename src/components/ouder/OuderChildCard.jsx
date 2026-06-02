import { Check } from 'lucide-react'
import {
  formatProfileBirthDate,
  profileAgeLabel,
  profileFullName,
} from '@/lib/profileDisplay.js'
import { FALLBACK_PROFILE_PIC, resolveProfileAvatarUrl } from '@/lib/profileAvatar.js'
import { cn } from '@/lib/utils'

export default function OuderChildCard({ child, selected = false, onSelect, avatarUrl }) {
  const name = profileFullName(child?.firstname, child?.lastname)
  const age = profileAgeLabel(child?.date_of_birth)
  const birthLabel = formatProfileBirthDate(child?.date_of_birth)
  const meta = [age, birthLabel].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={() => onSelect?.(child)}
      aria-pressed={selected}
      className={cn(
        'flex w-full min-h-[72px] cursor-pointer items-center gap-3 rounded-[14px] border-2 bg-white px-4 py-3.5 text-left',
        'shadow-[0_2px_0_0_#e1dbd3] transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 focus-visible:ring-offset-2',
        selected ? 'border-nimbli bg-[#f0faf7]' : 'border-[#e1dbd3] hover:border-nimbli/50'
      )}
    >
      <div className="relative size-12 shrink-0">
        <div className="size-12 overflow-hidden rounded-full bg-nimbli-canvas ring-2 ring-white">
          <img
            src={resolveProfileAvatarUrl(avatarUrl)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_PROFILE_PIC
            }}
          />
        </div>
        {selected ? (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-nimbli text-white ring-2 ring-white"
            aria-hidden
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-nimbli-heading text-sm font-black text-[#1a1a1a]">{name}</p>
        {meta ? <p className="mt-0.5 truncate text-xs text-[#6b7280]">{meta}</p> : null}
      </div>
    </button>
  )
}
