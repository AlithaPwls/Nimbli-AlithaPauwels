import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePracticeExercises } from '@/hooks/kine/usePracticeExercises.js'
import { categoryToneClasses } from '@/lib/exerciseDisplay.js'

const FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'mobiliteit', label: 'Mobiliteit' },
  { id: 'kracht', label: 'Kracht' },
  { id: 'balans', label: 'Balans' },
]

function matchesFilter(category, filter) {
  const cat = String(category || '').toLowerCase()
  if (filter === 'all') return true
  if (filter === 'mobiliteit') return cat.includes('mobiliteit')
  if (filter === 'kracht') return cat.includes('kracht')
  if (filter === 'balans') return cat.includes('balans')
  return true
}

function PickExerciseCard({ exercise, selected, disabled, onToggle }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={[
        'w-full rounded-2xl border-2 bg-white p-4 text-left shadow-[0_2px_0_0_#e1dbd3] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
        disabled ? 'cursor-not-allowed opacity-60' : '',
        selected ? 'border-nimbli' : 'border-[#e1dbd3] hover:border-nimbli/50',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
          <img
            src={exercise.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-nimbli-heading text-base font-bold text-nimbli-ink">{exercise.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={[
                'inline-flex h-5 items-center rounded-full px-2',
                categoryToneClasses(exercise.categoryTone),
              ].join(' ')}
            >
              {exercise.category}
            </span>
            <span className="text-nimbli-muted">{exercise.difficulty}</span>
            {disabled ? (
              <span className="font-semibold text-nimbli-muted">Al toegewezen</span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function AssignPatientExercisesDialog({
  open,
  onOpenChange,
  patientName,
  practiceId,
  assignedExerciseIds = [],
  loading: saving = false,
  error,
  onConfirm,
}) {
  const { exercises, loading, error: loadError } = usePracticeExercises(practiceId)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const assignedSet = useMemo(
    () => new Set(assignedExerciseIds.filter(Boolean)),
    [assignedExerciseIds]
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      setFilter('all')
      setSelectedIds(new Set())
    }
  }, [open])

  const available = useMemo(
    () => exercises.filter((e) => !assignedSet.has(e.id)),
    [exercises, assignedSet]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return available.filter((e) => {
      const matchQuery = !q || e.title.toLowerCase().includes(q)
      return matchQuery && matchesFilter(e.category, filter)
    })
  }, [query, filter, available])

  function toggle(id) {
    if (assignedSet.has(id)) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    onConfirm(Array.from(selectedIds))
  }

  const listError = loadError
  const noLibrary = !loading && !listError && exercises.length === 0
  const allAssigned = !loading && !listError && exercises.length > 0 && available.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1 border-b border-[#e1dbd3] px-6 py-4 text-left">
          <DialogTitle className="font-nimbli-heading text-xl font-bold text-nimbli-ink">
            Oefening toevoegen
          </DialogTitle>
          <DialogDescription className="text-sm text-nimbli-muted">
            Kies oefeningen uit je bibliotheek voor {patientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <label className="sr-only" htmlFor="assign-exercise-search">
            Zoek een oefening
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-nimbli-slot-border bg-white px-4 py-3">
            <Search className="size-4 shrink-0 text-nimbli-muted" aria-hidden />
            <input
              id="assign-exercise-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek een oefening"
              className="w-full bg-transparent text-sm text-nimbli-ink placeholder:text-nimbli-muted focus:outline-none"
              type="search"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = f.id === filter
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={[
                    'h-9 rounded-md border px-4 text-xs font-bold font-nimbli-heading transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
                    active
                      ? 'border-nimbli bg-nimbli text-white'
                      : 'border-nimbli bg-white text-nimbli-muted hover:bg-nimbli/5',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {listError ? (
            <p className="text-sm font-semibold text-red-600" role="alert">
              Oefeningen laden mislukt.
            </p>
          ) : null}

          {error ? (
            <p className="text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="py-8 text-center text-sm text-nimbli-muted">Oefeningen laden…</p>
          ) : noLibrary ? (
            <p className="py-8 text-center text-sm text-nimbli-muted">
              Er zijn nog geen oefeningen in je bibliotheek. Voeg eerst oefeningen toe via Oefeningen.
            </p>
          ) : allAssigned ? (
            <p className="py-8 text-center text-sm text-nimbli-muted">
              Alle oefeningen uit je bibliotheek zijn al toegewezen aan {patientName}.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-nimbli-muted">
              Geen oefeningen gevonden met deze filters.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((exercise) => (
                <li key={exercise.id}>
                  <PickExerciseCard
                    exercise={exercise}
                    selected={selectedIds.has(exercise.id)}
                    disabled={assignedSet.has(exercise.id)}
                    onToggle={() => toggle(exercise.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-[#e1dbd3] px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
            className="font-nimbli-heading"
          >
            Annuleren
          </Button>
          <Button
            type="button"
            disabled={saving || selectedIds.size === 0 || allAssigned || noLibrary}
            onClick={handleConfirm}
            className="bg-nimbli font-nimbli-heading font-bold text-white hover:bg-nimbli/90"
          >
            {saving ? 'Bezig…' : `Toewijzen (${selectedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
