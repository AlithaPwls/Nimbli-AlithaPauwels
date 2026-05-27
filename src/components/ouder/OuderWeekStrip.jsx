import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function OuderWeekStrip({
  days = [],
  activeKey = null,
  onSelectDay = null,
  onPrevWeek = null,
  onNextWeek = null,
  rangeLabel = '—',
}) {
  return (
    <section className="h-fit w-full max-w-full self-start rounded-lg border-2 border-[#e1dbd3] bg-white shadow-[0_2px_0_0_#e1dbd3]">
      <div className="px-3 py-3 sm:px-4">
        <p className="truncate text-center text-sm font-semibold text-[#302d2d]">{rangeLabel}</p>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-nimbli-slot-border/60 bg-white text-nimbli-muted transition-colors duration-200 hover:bg-nimbli-canvas hover:text-nimbli-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
            aria-label="Vorige week"
            onClick={() => onPrevWeek?.()}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>

          <div
            className="grid min-w-0 flex-1 grid-cols-7 gap-1.5"
            role="tablist"
            aria-label="Kies een dag"
          >
            {days.map((d) => {
              const key = d.key ?? `${d.dow}-${d.day}`
              const isActive = Boolean(d.key && activeKey && d.key === activeKey)

              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'date' : undefined}
                  onClick={() => onSelectDay?.(d.key)}
                  className={[
                    'group flex h-11 w-full min-w-0 cursor-pointer flex-col items-center justify-center rounded-lg border px-1 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
                    isActive
                      ? 'border-nimbli bg-nimbli text-white'
                      : 'border-nimbli-slot-border/60 bg-white text-[#302d2d] hover:bg-nimbli-canvas',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'font-nimbli-heading text-[10px] font-bold leading-none tracking-[-0.2px]',
                      isActive ? 'text-white' : 'text-nimbli-muted group-hover:text-nimbli-ink',
                    ].join(' ')}
                  >
                    {d.dow}
                  </span>
                  <span className="mt-0.5 font-nimbli-heading text-base font-black leading-none tracking-[-0.24px]">
                    {d.day}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-nimbli-slot-border/60 bg-white text-nimbli-muted transition-colors duration-200 hover:bg-nimbli-canvas hover:text-nimbli-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
            aria-label="Volgende week"
            onClick={() => onNextWeek?.()}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  )
}

