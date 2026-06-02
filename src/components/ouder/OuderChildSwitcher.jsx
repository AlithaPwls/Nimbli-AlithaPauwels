import { FALLBACK_PROFILE_PIC, resolveProfileAvatarUrl } from '@/lib/profileAvatar.js'
import { cn } from '@/lib/utils'

function childLabel(child) {
  const name = `${child?.firstname ?? ''} ${child?.lastname ?? ''}`.trim()
  return name || 'Kind'
}

/**
 * Switch active child on parent dashboard (no password — parent is already logged in).
 */
export default function OuderChildSwitcher({
  childrenList = [],
  selectedChildId = null,
  onSelectChild,
  className,
  compact = false,
}) {
  if (!Array.isArray(childrenList) || childrenList.length <= 1) return null

  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="tablist"
      aria-label="Kies kind"
    >
      {childrenList.map((c) => {
        const active = c?.id === selectedChildId
        const label = childLabel(c)
        const avatarSrc = resolveProfileAvatarUrl(c?.avatar_url)

        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!c?.id || c.id === selectedChildId) return
              onSelectChild?.(c.id)
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border-2 font-nimbli-heading text-sm font-bold outline-none transition-colors',
              compact ? 'px-3 py-1.5' : 'px-4 py-2',
              active
                ? 'border-nimbli bg-nimbli text-white shadow-[0_2px_0_0_#1e7a6a]'
                : 'border-[#e1dbd3] bg-white text-[#1a1a1a] shadow-[0_2px_0_0_#e1dbd3] hover:border-nimbli/40'
            )}
          >
            {!compact ? (
              <span className="size-7 shrink-0 overflow-hidden rounded-full border border-white/30 bg-[#f3f4f6]">
                <img
                  src={avatarSrc}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_PROFILE_PIC
                  }}
                />
              </span>
            ) : null}
            <span className="max-w-[10rem] truncate">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
