import { cn } from '@/lib/utils'

function initials(firstname, lastname) {
  const f = String(firstname ?? '').trim()
  const l = String(lastname ?? '').trim()
  const a = f ? f[0] : ''
  const b = l ? l[0] : ''
  return (a + b).toUpperCase() || 'K'
}

export default function OuderChildCard({
  child,
  selected = false,
  onSelect,
  avatarOverrideUrl,
}) {
  const name = `${child?.firstname ?? ''} ${child?.lastname ?? ''}`.trim() || 'Kind'
  const avatarUrl = avatarOverrideUrl || child?.avatar_url || null

  return (
    <button
      type="button"
      onClick={() => onSelect?.(child)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left',
        'shadow-[0_2px_0_0_#e1dbd3] transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
        selected ? 'border-nimbli' : 'border-[#e5e7eb] hover:border-nimbli/50'
      )}
    >
      <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-nimbli-heading text-sm font-black text-nimbli">
            {initials(child?.firstname, child?.lastname)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-nimbli-heading text-sm font-black text-[#1a1a1a]">{name}</p>
        <p className="mt-0.5 text-xs text-[#6b7280]">Profiel</p>
      </div>
    </button>
  )
}

