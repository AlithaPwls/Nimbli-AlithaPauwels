import { Minus, Plus, Search } from 'lucide-react'
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
import AssignExerciseScheduleDays from '@/components/kine/AssignExerciseScheduleDays.jsx'
import { usePracticeExercises } from '@/hooks/kine/usePracticeExercises.js'
import { categoryToneClasses, exerciseDescriptionForDialog } from '@/lib/exerciseDisplay.js'
import {
  defaultExerciseScheduleDays,
  normalizeScheduleDays,
  scheduleDaysSummary,
} from '@/lib/kine/exerciseScheduleDays.js'

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

function PickExerciseCard({ exercise, selected, scheduleDays, disabled, onToggle }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={[
        'w-full rounded-2xl border-2 bg-white p-4 text-left shadow-[0_2px_0_0_#e1dbd3] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
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
            {selected ? (
              <span className="ml-auto text-right font-semibold text-nimbli">
                Geselecteerd
                <span className="block text-[10px] font-normal text-nimbli-muted">
                  {scheduleDaysSummary(scheduleDays)}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}

function clampReps(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 10
  return Math.min(99, Math.max(1, n))
}

function exerciseDefaultReps(exercise) {
  const n = Number(exercise?.reps)
  return Number.isFinite(n) ? clampReps(n) : 10
}

function isVideoFile(url) {
  const u = String(url || '').toLowerCase()
  return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov')
}

function isYouTube(url) {
  const u = String(url || '').toLowerCase()
  return u.includes('youtu.be') || u.includes('youtube.com')
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
  const [activeId, setActiveId] = useState(null)
  const [selectedById, setSelectedById] = useState(() => ({}))
  const [activeReps, setActiveReps] = useState('10')
  const [activeScheduleDays, setActiveScheduleDays] = useState(defaultExerciseScheduleDays)
  const [scheduleError, setScheduleError] = useState(null)

  const assignedSet = useMemo(
    () => new Set(assignedExerciseIds.filter(Boolean)),
    [assignedExerciseIds]
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      setFilter('all')
      setActiveId(null)
      setSelectedById({})
      setActiveReps('10')
      setActiveScheduleDays(defaultExerciseScheduleDays())
      setScheduleError(null)
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

  const activeExercise = useMemo(
    () => exercises.find((e) => e.id === activeId) ?? null,
    [exercises, activeId]
  )

  const selectedCount = useMemo(() => Object.keys(selectedById).length, [selectedById])

  function openExercise(exercise) {
    if (!exercise?.id) return
    setActiveId(exercise.id)
    const existing = selectedById[exercise.id]
    const reps = existing?.reps ?? exerciseDefaultReps(exercise)
    setActiveReps(String(reps))
    setActiveScheduleDays(
      normalizeScheduleDays(existing?.scheduleDays ?? defaultExerciseScheduleDays())
    )
    setScheduleError(null)
  }

  function setScheduleDaysForActive(nextDays) {
    const normalized = normalizeScheduleDays(nextDays)
    setActiveScheduleDays(normalized)
    setScheduleError(null)
    if (!activeExercise?.id || !selectedById[activeExercise.id]) return
    setSelectedById((prev) => ({
      ...prev,
      [activeExercise.id]: {
        ...prev[activeExercise.id],
        scheduleDays: normalized,
      },
    }))
  }

  function toggleSelected() {
    if (!activeExercise?.id) return
    if (assignedSet.has(activeExercise.id)) return

    const nextReps = clampReps(activeReps)
    const nextDays = normalizeScheduleDays(activeScheduleDays)
    setActiveReps(String(nextReps))

    setSelectedById((prev) => {
      const next = { ...prev }
      if (next[activeExercise.id]) {
        delete next[activeExercise.id]
        setScheduleError(null)
      } else {
        if (nextDays.length === 0) {
          setScheduleError('Selecteer minstens één dag.')
          return prev
        }
        next[activeExercise.id] = { reps: nextReps, scheduleDays: nextDays }
        setScheduleError(null)
      }
      return next
    })
  }

  function setRepsForActive(nextValue) {
    setActiveReps(nextValue)
    if (!activeExercise?.id) return
    if (!selectedById[activeExercise.id]) return
    const nextReps = clampReps(nextValue)
    setSelectedById((prev) => ({
      ...prev,
      [activeExercise.id]: {
        ...prev[activeExercise.id],
        reps: nextReps,
        scheduleDays: normalizeScheduleDays(
          prev[activeExercise.id]?.scheduleDays ?? activeScheduleDays
        ),
      },
    }))
  }

  function handleConfirm() {
    const selections = Object.entries(selectedById).map(([exerciseId, value]) => ({
      exerciseId,
      reps: clampReps(value?.reps ?? 10),
      scheduleDays: normalizeScheduleDays(value?.scheduleDays),
    }))
    onConfirm({ selections })
  }

  const listError = loadError
  const noLibrary = !loading && !listError && exercises.length === 0
  const allAssigned = !loading && !listError && exercises.length > 0 && available.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="space-y-1 border-b border-[#e1dbd3] px-6 py-4 text-left">
          <DialogTitle className="font-nimbli-heading text-xl font-bold text-nimbli-ink">
            Oefening toevoegen
          </DialogTitle>
          <DialogDescription className="text-sm text-nimbli-muted">
            Kies oefeningen uit je bibliotheek voor {patientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-[1fr_360px]">
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-b border-[#e1dbd3] px-6 py-4 md:border-b-0 md:border-r">
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
                {filtered.map((exercise) => {
                  const selection = selectedById[exercise.id]
                  return (
                    <li key={exercise.id}>
                      <PickExerciseCard
                        exercise={exercise}
                        selected={Boolean(selection)}
                        scheduleDays={selection?.scheduleDays}
                        disabled={assignedSet.has(exercise.id)}
                        onToggle={() => openExercise(exercise)}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 py-4">
            {!activeExercise ? (
              <div className="rounded-2xl border border-[#e1dbd3] bg-white px-4 py-6 text-center text-sm text-nimbli-muted">
                Selecteer een oefening om details te bekijken.
              </div>
            ) : (
              <div className="flex min-h-0 flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
                    <img src={activeExercise.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-nimbli-heading text-base font-bold text-nimbli-ink">
                      {activeExercise.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={[
                          'inline-flex h-5 items-center rounded-full px-2',
                          categoryToneClasses(activeExercise.categoryTone),
                        ].join(' ')}
                      >
                        {activeExercise.category}
                      </span>
                      <span className="text-nimbli-muted">{activeExercise.difficulty}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e1dbd3] bg-white p-4">
                  <p className="text-sm font-semibold text-nimbli-ink">Beschrijving</p>
                  {exerciseDescriptionForDialog(activeExercise.description) ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-nimbli-muted">
                      {exerciseDescriptionForDialog(activeExercise.description)}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-nimbli-muted">—</p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#e1dbd3] bg-white p-4">
                  <p className="text-sm font-semibold text-nimbli-ink">Video</p>
                  {activeExercise.mediaUrl && isVideoFile(activeExercise.mediaUrl) ? (
                    <video
                      className="mt-3 w-full rounded-xl ring-1 ring-nimbli-slot-border/15"
                      src={activeExercise.mediaUrl}
                      controls
                      preload="metadata"
                    />
                  ) : activeExercise.mediaUrl && isYouTube(activeExercise.mediaUrl) ? (
                    <a
                      className="mt-2 inline-flex text-sm font-semibold text-nimbli underline-offset-4 hover:underline"
                      href={activeExercise.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Bekijk video
                    </a>
                  ) : activeExercise.mediaUrl ? (
                    <a
                      className="mt-2 inline-flex text-sm font-semibold text-nimbli underline-offset-4 hover:underline"
                      href={activeExercise.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open media
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-nimbli-muted">—</p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#e1dbd3] bg-white p-4">
                  <p className="text-sm font-semibold text-nimbli-ink">Herhalingen</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-10"
                      onClick={() => setRepsForActive(String(clampReps(Number(activeReps) - 1)))}
                      disabled={assignedSet.has(activeExercise.id)}
                      aria-label="Minder herhalingen"
                    >
                      <Minus className="size-4" aria-hidden />
                    </Button>

                    <input
                      className={[
                        'h-10 w-[72px] rounded-xl border border-nimbli-slot-border bg-white px-2 text-center text-sm font-semibold text-nimbli-ink',
                        'appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
                      ].join(' ')}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={99}
                      value={activeReps}
                      onChange={(e) => setRepsForActive(e.target.value)}
                      disabled={assignedSet.has(activeExercise.id)}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-10"
                      onClick={() => setRepsForActive(String(clampReps(Number(activeReps) + 1)))}
                      disabled={assignedSet.has(activeExercise.id)}
                      aria-label="Meer herhalingen"
                    >
                      <Plus className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>

                <AssignExerciseScheduleDays
                  value={activeScheduleDays}
                  onChange={setScheduleDaysForActive}
                  disabled={assignedSet.has(activeExercise.id)}
                  error={scheduleError}
                />

                <Button
                  type="button"
                  className="bg-nimbli font-nimbli-heading font-bold text-white hover:bg-nimbli/90"
                  onClick={toggleSelected}
                  disabled={assignedSet.has(activeExercise.id)}
                >
                  {selectedById[activeExercise.id] ? 'Verwijderen' : 'Selecteren'}
                </Button>
              </div>
            )}
          </aside>
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
            disabled={saving || selectedCount === 0 || allAssigned || noLibrary}
            onClick={handleConfirm}
            className="bg-nimbli font-nimbli-heading font-bold text-white hover:bg-nimbli/90"
          >
            {saving ? 'Bezig…' : `Toewijzen (${selectedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
