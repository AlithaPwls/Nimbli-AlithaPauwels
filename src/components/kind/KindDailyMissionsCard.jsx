import { CheckCircle2, Circle, Trophy } from 'lucide-react'
import { KIND_DAILY_MISSIONS } from '@/lib/kind/kindOverviewMock.js'
import { cn } from '@/lib/utils'

function progressWidthClass(current, total) {
  if (!total || current <= 0) return 'w-0'
  const pct = Math.min(100, Math.round((current / total) * 100))
  if (pct >= 100) return 'w-full'
  if (pct >= 66) return 'w-2/3'
  if (pct >= 33) return 'w-1/3'
  return 'w-[8%]'
}

function MissionProgress({ current, total, done, showReward }) {
  return (
    <div className="mt-1 flex items-center gap-1.5 pl-1.5 pr-5">
      <span className="shrink-0 font-nimbli-body text-[10px] leading-[14px] text-kind-black">
        {current}/{total}
      </span>
      <div className="relative min-w-0 flex-1">
        <div className="h-[7px] overflow-hidden rounded-full bg-kind-light-gray">
          <div
            className={cn(
              'h-full rounded-full bg-kind-yellow',
              progressWidthClass(current, total),
              !done && current > 0 && 'bg-kind-yellow/80'
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default function KindDailyMissionsCard({ className }) {
  return (
    <section
      className={cn(
        'w-full rounded-lg border-2 border-kind-border bg-kind-white p-[17px] shadow-[0_2px_0_0_#e1dbd3]',
        className
      )}
    >
      <h2 className="font-nimbli-heading text-[13px] font-bold text-kind-black">Dagmissies</h2>
      <div className="my-4 h-px bg-kind-border" />

      <div className="flex flex-col gap-1.5">
        {KIND_DAILY_MISSIONS.map((mission) => (
          <div
            key={mission.id}
            className="flex items-center gap-3 rounded-md border border-kind-border bg-kind-white px-[17px] py-3 shadow-[0_2px_0_0_#e1dbd3]"
          >
            {mission.done ? (
              <CheckCircle2
                className="size-[21px] shrink-0 text-kind-green-success"
                strokeWidth={2.25}
                aria-hidden
              />
            ) : (
              <Circle className="size-[21px] shrink-0 text-kind-light-gray" strokeWidth={2} aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-nimbli-body text-[13px] leading-[18px] text-kind-black">
                {mission.title}
              </p>
              <MissionProgress
                current={mission.current}
                total={mission.total}
                done={mission.done}
                showReward={mission.showReward}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
