import { useCallback, useEffect, useRef, useState } from 'react'
import KinePatientSessionRow from '@/components/kine/KinePatientSessionRow.jsx'
import { cn } from '@/lib/utils'

const SESSIONS_VISIBLE_WITHOUT_SCROLL = 8
/** ~8 session rows (py-3 + 2 lines) + gaps between */
const SESSIONS_LIST_MAX_HEIGHT =
  'max-h-[calc(8*3.5rem+7*0.75rem)]'

export default function KinePatientSessionsSection({
  sessions = [],
  loading = false,
  patientName = 'de patiënt',
}) {
  const list = Array.isArray(sessions) ? sessions : []
  const isEmpty = !loading && list.length === 0
  const listScrollable = list.length > SESSIONS_VISIBLE_WITHOUT_SCROLL
  const listRef = useRef(null)
  const [showBottomFade, setShowBottomFade] = useState(false)

  const updateBottomFade = useCallback(() => {
    const el = listRef.current
    if (!el || !listScrollable) {
      setShowBottomFade(false)
      return
    }
    const hasMoreBelow = el.scrollHeight - el.clientHeight - el.scrollTop > 4
    setShowBottomFade(hasMoreBelow)
  }, [listScrollable])

  useEffect(() => {
    updateBottomFade()
    const el = listRef.current
    if (!el || !listScrollable) return undefined

    el.addEventListener('scroll', updateBottomFade, { passive: true })
    const observer = new ResizeObserver(updateBottomFade)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateBottomFade)
      observer.disconnect()
    }
  }, [listScrollable, list.length, updateBottomFade])

  return (
    <section className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 pb-8 pt-8 shadow-[0_2px_0_0_#e1dbd3] max-lg:px-5 max-lg:pb-6 max-lg:pt-6 max-sm:px-4 max-sm:pb-5 max-sm:pt-5">
      <header>
        <h2 className="font-nimbli-heading text-[22px] font-bold text-[#1a1a1a] max-sm:text-lg">Sessies</h2>
        <p className="mt-1 text-[15px] text-nimbli-muted max-sm:text-sm">Alle voltooide oefeningen</p>
      </header>

      <div className="mt-6 max-sm:mt-4">
        {loading ? (
          <p className="text-sm text-nimbli-muted">Sessies laden…</p>
        ) : isEmpty ? (
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-6 py-12 text-center">
            <p className="font-nimbli-heading text-base font-bold text-nimbli-ink">
              Nog geen sessies beschikbaar
            </p>
            <p className="mt-2 text-sm text-nimbli-muted">
              Zodra {patientName} een oefening voltooit, verschijnt die hier.
            </p>
          </div>
        ) : (
          <div className="relative">
            <ul
              ref={listRef}
              className={cn(
                'flex flex-col gap-3',
                listScrollable &&
                  `${SESSIONS_LIST_MAX_HEIGHT} overflow-y-auto overscroll-contain pr-1`
              )}
            >
              {list.map((session) => (
                <li key={session.id}>
                  <KinePatientSessionRow
                    title={session.title}
                    time={session.time}
                    score={session.score}
                    success={session.success}
                  />
                </li>
              ))}
            </ul>
            {showBottomFade ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent"
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
