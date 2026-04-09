import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth.js'
import { usePracticeExercises } from '@/hooks/kine/usePracticeExercises.js'
import { categoryToneClasses } from '@/lib/exerciseDisplay.js'
import { readAddPatientDraft, updateAddPatientDraft } from '@/lib/addPatientDraft'

const FILTERS = [
  { id: 'all', label: 'Alle oefeningen' },
  { id: 'mobiliteit', label: 'Mobiliteit' },
  { id: 'kracht', label: 'Kracht' },
  { id: 'balans', label: 'Balans' },
]

function StepHeader() {
  return (
    <header className="max-w-5xl">
      <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-[#302d2d]">
        Nieuwe patiënt toevoegen
      </h1>
      <p className="mt-3 text-sm font-semibold text-nimbli-muted">Stap 2 van 4</p>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-white" />
        <div className="h-3 rounded-full bg-white" />
      </div>
    </header>
  )
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border-2 border-[#e1dbd3] bg-white p-8 shadow-[0_2px_0_0_#e1dbd3]">
      <div>
        <h2 className="font-nimbli-heading text-2xl font-bold text-nimbli-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-nimbli-muted">{subtitle}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function ExerciseCard({ exercise, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'w-full rounded-2xl border-2 bg-white p-6 text-left shadow-[0_2px_0_0_#e1dbd3] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
        selected ? 'border-nimbli' : 'border-[#e1dbd3] hover:border-nimbli/50',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
          <img
            src={exercise.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-nimbli-heading text-lg font-bold text-nimbli-ink">{exercise.title}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span
              className={[
                'inline-flex h-5 items-center rounded-full px-2 text-xs',
                categoryToneClasses(exercise.categoryTone),
              ].join(' ')}
            >
              {exercise.category}
            </span>
            <span className="text-nimbli-muted">•</span>
            <span className="text-xs text-nimbli-ink">{exercise.difficulty}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-nimbli-muted">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>↻</span>
              {exercise.reps}
            </span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>⏱</span>
              {exercise.time}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export default function AddPatient2() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null
  const { exercises, loading, error } = usePracticeExercises(practiceId)

  const draft = readAddPatientDraft() ?? {}
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState(() => {
    const fromDraft = Array.isArray(draft.selectedExerciseIds) ? draft.selectedExerciseIds : []
    return new Set(fromDraft)
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter((e) => {
      const matchQuery = !q || e.title.toLowerCase().includes(q)
      const cat = e.category.toLowerCase()
      const matchFilter =
        filter === 'all' ||
        (filter === 'mobiliteit' && cat.includes('mobiliteit')) ||
        (filter === 'kracht' && cat.includes('kracht')) ||
        (filter === 'balans' && cat.includes('balans'))
      return matchQuery && matchFilter
    })
  }, [query, filter, exercises])

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      updateAddPatientDraft({ selectedExerciseIds: Array.from(next) })
      return next
    })
  }

  function goNext() {
    updateAddPatientDraft({ selectedExerciseIds: Array.from(selectedIds) })
    navigate('/dashboard/kine/patienten/nieuw/3')
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
      <StepHeader />

      <div className="mt-10">
        <SectionCard
          title="Startprogramma"
          subtitle="Voeg al startoefeningen toe of sla dit voorlopig over."
        >
          <label className="sr-only" htmlFor="exercise-search">
            Zoek een oefening
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-nimbli-slot-border bg-white px-4 py-3">
            <Search className="size-4 text-nimbli-muted" aria-hidden />
            <input
              id="exercise-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek een oefening"
              className="w-full bg-transparent text-sm text-nimbli-ink placeholder:text-nimbli-muted focus:outline-none"
              type="text"
              autoComplete="off"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {FILTERS.map((f) => {
              const active = f.id === filter
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={[
                    'h-11 rounded-md border px-5 text-sm font-bold transition-colors',
                    'font-nimbli-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
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

          {error ? (
            <div
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800"
              role="alert"
            >
              <p className="text-sm font-semibold">Oefeningen laden mislukt</p>
              <p className="mt-1 font-nimbli-body text-xs leading-snug opacity-90">
                {error.message || String(error)}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {loading ? (
              <div className="col-span-full rounded-2xl border-2 border-[#e1dbd3] bg-nimbli-canvas/50 px-4 py-10 text-center text-sm text-nimbli-muted">
                Oefeningen laden…
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full rounded-2xl border-2 border-[#e1dbd3] bg-white px-4 py-10 text-center text-sm text-nimbli-muted shadow-[0_2px_0_0_#e1dbd3]">
                {exercises.length === 0
                  ? 'Er zijn nog geen oefeningen in je bibliotheek. Voeg oefeningen toe via Oefeningen.'
                  : 'Geen oefeningen gevonden met deze filters.'}
              </div>
            ) : (
              filtered.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  selected={selectedIds.has(exercise.id)}
                  onToggle={() => toggle(exercise.id)}
                />
              ))
            )}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-11 border-nimbli font-nimbli-heading font-black text-nimbli shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/5"
              onClick={() => navigate('/dashboard/kine/patienten/nieuw')}
            >
              <ArrowLeft className="mr-2 size-5" aria-hidden />
              Vorige
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-nimbli font-nimbli-heading font-black text-nimbli shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/5"
                onClick={goNext}
              >
                Overslaan
              </Button>

              <Button
                type="button"
                className="h-11 bg-nimbli font-nimbli-heading font-black text-nimbli-foreground shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90"
                onClick={goNext}
              >
                Opslaan
                <ArrowRight className="ml-2 size-5" aria-hidden />
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

