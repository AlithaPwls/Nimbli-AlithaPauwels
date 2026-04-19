import { useMemo, useState } from 'react'
import { Clock, Repeat2 } from 'lucide-react'
import ExerciseDetailDialog from '@/components/kine/ExerciseDetailDialog.jsx'
import KineOefeningenModeSwitch from '@/components/kine/KineOefeningenModeSwitch.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { usePracticeExercises } from '@/hooks/kine/usePracticeExercises.js'
import { categoryToneClasses, normalizeExerciseRow } from '@/lib/exerciseDisplay.js'
import { rowHasUploadedVideoFile } from '@/lib/eigenExerciseCard.js'

const FILTERS = [
  { id: 'all', label: 'Alle oefeningen' },
  { id: 'mobiliteit', label: 'Mobiliteit' },
  { id: 'kracht', label: 'Kracht' },
  { id: 'balans', label: 'Balans' },
]

export default function KineOefeningen() {
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null
  const { rawRows, loading, error } = usePracticeExercises(practiceId)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedExercise, setSelectedExercise] = useState(null)

  const libraryExercises = useMemo(() => {
    return (rawRows ?? [])
      .filter((r) => !rowHasUploadedVideoFile(r))
      .map((r) => normalizeExerciseRow(r))
  }, [rawRows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return libraryExercises.filter((e) => {
      const matchQuery = !q || e.title.toLowerCase().includes(q)
      const cat = e.category.toLowerCase()
      const matchCategory =
        category === 'all' ||
        (category === 'mobiliteit' && cat.includes('mobiliteit')) ||
        (category === 'kracht' && cat.includes('kracht')) ||
        (category === 'balans' && cat.includes('balans'))
      return matchQuery && matchCategory
    })
  }, [libraryExercises, query, category])

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
      <ExerciseDetailDialog
        exercise={selectedExercise}
        onOpenChange={(open) => {
          if (!open) setSelectedExercise(null)
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-nimbli-ink">
            Oefeningen bibliotheek
          </h1>
        </div>

        <KineOefeningenModeSwitch />
      </div>

      <div className="mt-6 rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3]">
        <label className="sr-only" htmlFor="exercise-library-search">
          Zoek een oefening
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-nimbli-slot-border bg-white px-4 py-3">
          <span className="text-nimbli-muted" aria-hidden>
            ⌕
          </span>
          <input
            id="exercise-library-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek een oefening"
            className="w-full bg-transparent text-sm text-nimbli-ink placeholder:text-nimbli-muted focus:outline-none"
            type="search"
            autoComplete="off"
          />
        </div>

        {error ? (
          <div
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800"
            role="alert"
          >
            <p className="text-sm font-semibold">Oefeningen laden mislukt</p>
            <p className="mt-1 font-nimbli-body text-xs leading-snug opacity-90">
              {error.message || String(error)}
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          {FILTERS.map((f) => {
            const active = category === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategory(f.id)}
                className={[
                  'h-11 cursor-pointer rounded-md border px-5 font-nimbli-heading text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
                  active
                    ? 'border-nimbli bg-nimbli text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]'
                    : 'border-nimbli bg-white text-nimbli-muted hover:bg-nimbli/5',
                ].join(' ')}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {loading ? (
            <div className="col-span-full rounded-2xl border border-nimbli-canvas bg-nimbli-canvas/40 px-4 py-12 text-center text-sm text-nimbli-muted">
              Oefeningen laden…
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl border-2 border-[#e1dbd3] bg-white px-4 py-12 text-center text-sm text-nimbli-muted shadow-[0_2px_0_0_#e1dbd3]">
              {libraryExercises.length === 0
                ? 'Nog geen oefeningen in de bibliotheek.'
                : 'Geen oefeningen gevonden met deze filters.'}
            </div>
          ) : (
            filtered.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedExercise(exercise)}
                className="w-full cursor-pointer rounded-[14px] border-2 border-[#e1dbd3] bg-white p-6 pt-[25px] text-left shadow-[0_2px_0_0_#e1dbd3] transition-colors hover:border-nimbli/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
              >
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
                    <img
                      src={exercise.imageUrl}
                      alt=""
                      className="h-full w-full scale-105 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-nimbli-heading text-lg font-bold text-[#1a1a1a]">{exercise.title}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'inline-flex h-5 min-w-[58px] items-center justify-center rounded-full px-2 font-nimbli-heading text-xs font-bold text-[#302d2d]',
                          categoryToneClasses(exercise.categoryTone),
                        ].join(' ')}
                      >
                        {exercise.category}
                      </span>
                      <span className="text-nimbli-muted">•</span>
                      <span className="text-xs text-[#302d2d]">{exercise.difficulty}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#302d2d]">
                      <span className="inline-flex items-center gap-1">
                        <Repeat2 className="size-3.5 shrink-0 text-[#302d2d]" aria-hidden />
                        {exercise.reps}
                      </span>
                      <span className="text-nimbli-muted">•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5 shrink-0 text-[#302d2d]" aria-hidden />
                        {exercise.time}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
