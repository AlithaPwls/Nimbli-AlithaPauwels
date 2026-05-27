import OuderRecentRow from '@/components/ouder/OuderRecentRow.jsx'
import { cn } from '@/lib/utils'

/** ~3 recent rows visible; up to 5 items loaded in parent hooks. */
const SCROLL_LIST_CLASS = 'max-h-[212px] overflow-y-auto pr-1 [-ms-overflow-style:auto] [scrollbar-width:thin]'

export default function OuderRecentSection({ items = [], loading = false, className }) {
  return (
    <section
      className={cn(
        'flex min-h-0 w-full min-w-0 flex-col border-2 border-[#e1dbd3] bg-white px-[21px] pb-[22px] pt-[21px] shadow-[0_2px_0_0_#e1dbd3]',
        className
      )}
    >
      <p className="shrink-0 font-nimbli-heading text-base font-bold text-[#1a1a1a]">Recent</p>
      <div className={cn('mt-4', SCROLL_LIST_CLASS)}>
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-sm text-nimbli-muted">Recent laden…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-nimbli-muted">Nog geen recente sessies.</div>
          ) : (
            items.map((r) => (
              <OuderRecentRow key={r.id} title={r.title} time={r.time} xp={r.xp} />
            ))
          )}
        </div>
      </div>
    </section>
  )
}
