import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import caretSvg from '@/assets/kind-today-popover-caret.svg'
import KindTodayExerciseRow from '@/components/kind/KindTodayExerciseRow.jsx'
import { useKindTodayExercises } from '@/hooks/kind/useKindTodayExercises.js'
import { cn } from '@/lib/utils'

const MOBILE_PANEL_QUERY = '(max-width: 1023px)'

export default function KindTodayExercisesPanel({ open, anchorRect, onClose, onStartExercise }) {
  const { exercises, loading, error, refetch, childResolved } = useKindTodayExercises()
  const [isMobilePanel, setIsMobilePanel] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_PANEL_QUERY)

    function syncPanelMode() {
      setIsMobilePanel(mediaQuery.matches)
    }

    syncPanelMode()
    mediaQuery.addEventListener('change', syncPanelMode)
    return () => mediaQuery.removeEventListener('change', syncPanelMode)
  }, [])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) void refetch({ soft: true })
  }, [open, refetch])

  if (!open || !anchorRect) return null

  const panelWidth = Math.min(290, window.innerWidth - 24)
  const anchorCenterX = anchorRect.left + anchorRect.width / 2
  const top = anchorRect.bottom + 6
  const maxTop = Math.max(8, window.innerHeight - 340)
  const clampedTop = Math.min(top, maxTop)
  const clampedLeft = Math.min(
    Math.max(anchorCenterX, panelWidth / 2 + 12),
    window.innerWidth - panelWidth / 2 - 12
  )

  const panelStyle = isMobilePanel
    ? {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    : {
        top: `${clampedTop}px`,
        left: `${clampedLeft}px`,
        transform: 'translateX(-50%)',
      }

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-black/15"
        aria-label="Sluit oefeningen"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kind-today-exercises-title"
        className="pointer-events-auto fixed z-50 w-[min(290px,calc(100vw-1.5rem))] max-h-[min(70vh,420px)] overflow-y-auto rounded-lg"
        style={panelStyle}
      >
        <h2 id="kind-today-exercises-title" className="sr-only">
          Oefeningen van vandaag
        </h2>
        <div className={cn('flex flex-col items-center', isMobilePanel && 'w-full')}>
          {!isMobilePanel ? (
            <img src={caretSvg} alt="" className="relative z-[1] h-6 w-11 shrink-0" width={45} height={24} />
          ) : null}
          <div
            className={cn(
              'w-full divide-y divide-kind-border overflow-hidden rounded-lg border border-kind-light-gray/90 bg-kind-white shadow-[0px_4px_4px_rgba(0,0,0,0.12)]',
              !isMobilePanel && '-mt-px'
            )}
          >
            {loading ? (
              <p className="px-2.5 py-4 text-center font-nimbli-body text-xs text-kind-gray">Laden…</p>
            ) : error ? (
              <p className="px-2.5 py-4 text-center font-nimbli-body text-xs text-kind-red">
                Oefeningen laden lukt niet. Probeer later opnieuw.
              </p>
            ) : !childResolved ? (
              <p className="px-2.5 py-4 text-center font-nimbli-body text-xs text-kind-gray">
                Geen kindprofiel gevonden.
              </p>
            ) : exercises.length === 0 ? (
              <p className="px-2.5 py-4 text-center font-nimbli-body text-xs text-kind-gray">
                Nog geen oefeningen toegewezen.
              </p>
            ) : (
              exercises.map((exercise) => (
                <KindTodayExerciseRow
                  key={exercise.assignmentId}
                  exercise={exercise}
                  onStart={onStartExercise}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
