import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const SEGMENTS = 12

/**
 * Visual hold timer for pose flow — no digits (child-friendly).
 * @param {{ progress01: number, className?: string }} props
 */
export default function PoseHoldRing({ progress01, className }) {
  const progress = Math.max(0, Math.min(1, Number(progress01) || 0))
  const filledCount = Math.min(SEGMENTS, Math.ceil(progress * SEGMENTS))

  return (
    <div
      className={cn('relative mx-auto grid size-[min(42vw,168px)] place-items-center max-lg:size-[min(38vw,140px)]', className)}
      role="img"
      aria-label="Rustpositie vasthouden"
    >
      <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
        {Array.from({ length: SEGMENTS }, (_, index) => {
          const angle = (index / SEGMENTS) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const cx = 60 + Math.cos(rad) * 44
          const cy = 60 + Math.sin(rad) * 44
          const filled = index < filledCount
          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r={7}
              className={cn(
                'transition-colors duration-150',
                filled ? 'fill-kind-green-primary' : 'fill-white/30'
              )}
            />
          )
        })}
        <circle cx="60" cy="60" r="22" className="fill-kind-yellow/90" />
      </svg>
      <UserRound
        className="pointer-events-none absolute size-9 text-nimbli-ink/80 max-lg:size-8"
        strokeWidth={2.25}
        aria-hidden
      />
    </div>
  )
}
