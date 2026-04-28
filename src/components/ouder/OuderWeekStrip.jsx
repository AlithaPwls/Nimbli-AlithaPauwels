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
    <section className="rounded-xl border-2 border-nimbli-slot-border/70 bg-white shadow-[0_2px_0_0_#e1dbd3]">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <button
          type="button"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-nimbli-slot-border/60 bg-white text-nimbli-muted transition-colors duration-200 hover:bg-nimbli-canvas hover:text-nimbli-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
          aria-label="Vorige week"
          onClick={() => onPrevWeek?.()}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-center">
            <span className="truncate text-sm font-semibold text-[#302d2d]">{rangeLabel}</span>
          </div>

          <div
            className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    'group inline-flex min-w-[64px] cursor-pointer flex-col items-center justify-center rounded-xl border px-3 py-2 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
                    isActive
                      ? 'border-nimbli bg-nimbli text-white'
                      : 'border-nimbli-slot-border/60 bg-white text-[#302d2d] hover:bg-nimbli-canvas',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'font-nimbli-heading text-[11px] font-bold tracking-[-0.24px]',
                      isActive ? 'text-white' : 'text-nimbli-muted group-hover:text-nimbli-ink',
                    ].join(' ')}
                  >
                    {d.dow}
                  </span>
                  <span className="mt-1 font-nimbli-heading text-xl font-black tracking-[-0.32px]">
                    {d.day}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-nimbli-slot-border/60 bg-white text-nimbli-muted transition-colors duration-200 hover:bg-nimbli-canvas hover:text-nimbli-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
          aria-label="Volgende week"
          onClick={() => onNextWeek?.()}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  )
}

