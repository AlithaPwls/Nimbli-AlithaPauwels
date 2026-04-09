import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { readAddPatientDraft, updateAddPatientDraft } from '@/lib/addPatientDraft'

const EXERCISE_IMAGES = {
  stretchNaarDeSterren: 'https://www.figma.com/api/mcp/asset/5438d5a0-91e7-443a-8a74-459b47d28c5d',
  superheldPose: 'https://www.figma.com/api/mcp/asset/41b58f5d-d5f8-4287-9f97-43f85d39a174',
  jumpingJacks: 'https://www.figma.com/api/mcp/asset/d1b0702b-3425-4f95-bc11-f584f6eec1e5',
  balansBrug: 'https://www.figma.com/api/mcp/asset/b8160196-23cb-48f5-93d3-c5178b032e85',
}

const FILTERS = [
  { id: 'all', label: 'Alle oefeningen' },
  { id: 'mobiliteit', label: 'Mobiliteit' },
  { id: 'kracht', label: 'Kracht' },
  { id: 'balans', label: 'Balans' },
]

const EXERCISES = [
  {
    id: 'stretch',
    title: 'Stretch naar de Sterren',
    category: 'Mobiliteit',
    categoryTone: 'yellow',
    difficulty: 'Makkelijk',
    reps: '10x herhalingen',
    time: '2 min',
    imageUrl: EXERCISE_IMAGES.stretchNaarDeSterren,
  },
  {
    id: 'superheld',
    title: 'Superheld pose',
    category: 'Balans',
    categoryTone: 'green',
    difficulty: 'Moeilijk',
    reps: '12x herhalingen',
    time: '2 min',
    imageUrl: EXERCISE_IMAGES.superheldPose,
  },
  {
    id: 'jumping-jacks',
    title: 'Jumping Jacks',
    category: 'Kracht',
    categoryTone: 'purple',
    difficulty: 'Gemiddeld',
    reps: '15x herhalingen',
    time: '3 min',
    imageUrl: EXERCISE_IMAGES.jumpingJacks,
  },
  {
    id: 'balans-brug',
    title: 'Balans Brug',
    category: 'Balans',
    categoryTone: 'green',
    difficulty: 'Moeilijk',
    reps: '8x herhalingen',
    time: '4 min',
    imageUrl: EXERCISE_IMAGES.balansBrug,
  },
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

function toneClasses(tone) {
  switch (tone) {
    case 'yellow':
      return 'bg-[#FBB92A] text-[#302d2d]'
    case 'green':
      return 'bg-[#BDE786] text-[#302d2d]'
    case 'purple':
      return 'bg-[#E9B5FF] text-[#302d2d]'
    default:
      return 'bg-nimbli/15 text-nimbli-ink'
  }
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
            <span className={['inline-flex h-5 items-center rounded-full px-2 text-xs', toneClasses(exercise.categoryTone)].join(' ')}>
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
  const draft = readAddPatientDraft() ?? {}
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState(() => {
    const fromDraft = Array.isArray(draft.selectedExerciseIds) ? draft.selectedExerciseIds : []
    return new Set(fromDraft)
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EXERCISES.filter((e) => {
      const matchQuery = !q || e.title.toLowerCase().includes(q)
      const matchFilter =
        filter === 'all' ||
        (filter === 'mobiliteit' && e.category === 'Mobiliteit') ||
        (filter === 'kracht' && e.category === 'Kracht') ||
        (filter === 'balans' && e.category === 'Balans')
      return matchQuery && matchFilter
    })
  }, [query, filter])

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

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {filtered.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                selected={selectedIds.has(exercise.id)}
                onToggle={() => toggle(exercise.id)}
              />
            ))}
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

