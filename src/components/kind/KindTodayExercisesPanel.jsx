import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import caretSvg from '@/assets/kind-today-popover-caret.svg'
import KindTodayExerciseRow from '@/components/kind/KindTodayExerciseRow.jsx'
import { useKindTodayExercises } from '@/hooks/kind/useKindTodayExercises.js'

export default function KindTodayExercisesPanel({ open, anchorRect, onClose, onStartExercise }) {
  const { exercises, loading, error, refetch, childResolved } = useKindTodayExercises()
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

  const top = anchorRect.bottom + 6
  const left = anchorRect.left + anchorRect.width / 2
  const maxTop = typeof window !== 'undefined' ? Math.max(8, window.innerHeight - 340) : top
  const clampedTop = typeof window !== 'undefined' ? Math.min(top, maxTop) : top

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
        className="pointer-events-auto fixed z-50 w-[min(290px,calc(100vw-1.5rem))] max-h-[min(70vh,420px)] overflow-y-auto rounded-b-lg"
        style={{
          top: `${clampedTop}px`,
          left: `${left}px`,
          transform: 'translateX(-50%)',
        }}
      >
        <h2 id="kind-today-exercises-title" className="sr-only">
          Oefeningen van vandaag
        </h2>
        <div className="flex flex-col items-center">
          <img src={caretSvg} alt="" className="relative z-[1] h-6 w-11 shrink-0" width={45} height={24} />
          <div className="-mt-px w-full divide-y divide-kind-border overflow-hidden rounded-b-lg border border-kind-light-gray/90 bg-kind-white shadow-[0px_4px_4px_rgba(0,0,0,0.12)]">
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
