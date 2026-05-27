import { Flame, Star, Target, Trophy } from 'lucide-react'
import { KIND_BADGES } from '@/lib/kind/kindOverviewMock.js'
import { cn } from '@/lib/utils'

const TONE_CLASS = {
  blue: 'bg-kind-blue text-kind-white shadow-[0_4px_3px_rgba(0,0,0,0.1),0_2px_2px_rgba(0,0,0,0.1)]',
  pink: 'bg-[#ff8fab] text-kind-white shadow-[0_4px_3px_rgba(0,0,0,0.1),0_2px_2px_rgba(0,0,0,0.1)]',
  green:
    'bg-kind-green-primary text-kind-white shadow-[0_4px_3px_rgba(0,0,0,0.1),0_2px_2px_rgba(0,0,0,0.1)]',
  yellow: 'bg-kind-yellow text-kind-white shadow-[0_4px_3px_rgba(0,0,0,0.1),0_2px_2px_rgba(0,0,0,0.1)]',
  gray: 'bg-[#d1d5db] text-kind-white opacity-50 shadow-[0_4px_3px_rgba(0,0,0,0.1),0_2px_2px_rgba(0,0,0,0.1)]',
}

function BadgeIcon({ type }) {
  const props = { className: 'size-5', strokeWidth: 2.25, 'aria-hidden': true }
  if (type === 'flame') return <Flame {...props} />
  if (type === 'target') return <Target {...props} />
  if (type === 'trophy') return <Trophy {...props} />
  return <Star {...props} className="size-5 fill-current" />
}

export default function KindBadgesCard() {
  return (
    <section className="rounded-lg border-2 border-kind-border bg-kind-white px-[25px] pb-6 pt-[25px] shadow-[0_2px_0_0_#e1dbd3]">
      <h2 className="font-nimbli-heading text-lg font-bold leading-[25.2px] text-[#1a1a1a]">
        Badges
      </h2>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {KIND_BADGES.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              'flex h-[100px] flex-col items-center justify-center gap-2 rounded-[14px] border-2 bg-kind-white px-0.5 py-3.5',
              'shadow-[0_4px_2px_rgba(0,0,0,0.25)]',
              badge.unlocked ? 'border-[#f9fafb]' : 'border-[rgba(229,231,235,0.87)]'
            )}
          >
            <div
              className={cn(
                'grid size-12 place-items-center rounded-full',
                TONE_CLASS[badge.tone] ?? TONE_CLASS.gray
              )}
            >
              <BadgeIcon type={badge.icon} />
            </div>
            <p
              className={cn(
                'text-center font-nimbli-heading text-xs font-bold leading-4',
                badge.unlocked ? 'text-[#1a1a1a]' : 'text-[#9ca3af]'
              )}
            >
              {badge.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
