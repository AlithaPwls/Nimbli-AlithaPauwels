import { useMemo, useState } from 'react'
import { CirclePlay, Clock, Plus, Repeat2 } from 'lucide-react'
import AddExerciseDialog from '@/components/kine/AddExerciseDialog.jsx'
import ExerciseDetailDialog from '@/components/kine/ExerciseDetailDialog.jsx'
import KineOefeningenModeSwitch from '@/components/kine/KineOefeningenModeSwitch.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { usePracticeExercises } from '@/hooks/kine/usePracticeExercises.js'
import { normalizeExerciseRow } from '@/lib/exerciseDisplay.js'
import { dbExerciseRowToEigenVideoCard, rowHasUploadedVideoFile } from '@/lib/eigenExerciseCard.js'

const FILTER_CHIPS = [
  { id: 'all', label: 'Alle oefeningen' },
  { id: 'mobiliteit', label: 'Mobiliteit' },
  { id: 'kracht', label: 'Kracht' },
  { id: 'balans', label: 'Balans' },
]

export default function KineOefeningenEigenVideos() {
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null

  const { rawRows, loading, error, refetch } = usePracticeExercises(practiceId)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)

  const rawById = useMemo(() => {
    const m = new Map()
    for (const r of rawRows ?? []) {
      if (r?.id != null) m.set(r.id, r)
    }
    return m
  }, [rawRows])

  const videos = useMemo(() => {
    if (!practiceId) return []
    return (rawRows ?? []).filter(rowHasUploadedVideoFile).map(dbExerciseRowToEigenVideoCard)
  }, [practiceId, rawRows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return videos.filter((row) => {
      if (category !== 'all' && row.category !== category) return false
      if (!q) return true
      return row.title.toLowerCase().includes(q)
    })
  }, [query, category, videos])

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
        {error ? (
          <p className="mb-4 text-sm font-medium text-red-600">
            Oefeningen laden mislukt. Controleer je verbinding of rechten.
          </p>
        ) : null}
        <label className="sr-only" htmlFor="eigen-videos-search">
          Zoek een oefening
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-[#7c7c7c] bg-white px-3 py-2.5">
          <span className="text-[#7c7c7c]" aria-hidden>
            ⌕
          </span>
          <input
            id="eigen-videos-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek een oefening"
            className="w-full bg-transparent text-base text-nimbli-ink placeholder:text-[#7c7c7c] focus:outline-none"
            type="search"
            autoComplete="off"
          />
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {FILTER_CHIPS.map((chip) => {
              const active = category === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setCategory(chip.id)}
                  className={[
                    'h-11 rounded border px-5 font-nimbli-heading text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
                    active
                      ? 'border-nimbli bg-nimbli text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]'
                      : 'border-nimbli bg-white text-[#6b7280] hover:bg-nimbli/5',
                  ].join(' ')}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setAddExerciseOpen(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded border border-transparent bg-nimbli px-5 font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
          >
            <Plus className="size-[18px] shrink-0" strokeWidth={2.5} aria-hidden />
            Oefening toevoegen
          </button>
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm text-nimbli-muted">Oefeningen laden…</p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {filtered.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => {
                  const raw = rawById.get(video.id)
                  if (raw) setSelectedExercise(normalizeExerciseRow(raw))
                }}
                className="w-full rounded-[14px] border-2 border-[#e1dbd3] bg-white p-6 pt-[25px] text-left shadow-[0_2px_0_0_#e1dbd3] transition-colors hover:border-nimbli/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
                    {video.videoUrl ? (
                      <video
                        src={video.videoUrl}
                        className="h-full w-full scale-105 object-cover blur-[1px]"
                        muted
                        playsInline
                        preload="metadata"
                        aria-hidden
                      />
                    ) : (
                      <img
                        src={video.thumb}
                        alt=""
                        className="h-full w-full scale-105 object-cover blur-[1px]"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <CirclePlay
                      className="pointer-events-none absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 fill-white text-white drop-shadow-md"
                      strokeWidth={0}
                      aria-hidden
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-nimbli-heading text-lg font-bold text-[#1a1a1a]">{video.title}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'inline-flex h-5 min-w-[58px] items-center justify-center rounded-full px-2 text-xs text-[#302d2d]',
                          video.tagClass,
                        ].join(' ')}
                      >
                        {video.categoryLabel}
                      </span>
                      <span className="text-nimbli-muted">•</span>
                      <span className="text-xs text-[#302d2d]">{video.difficulty}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#302d2d]">
                      <span className="inline-flex items-center gap-1">
                        <Repeat2 className="size-3.5 shrink-0 text-[#302d2d]" aria-hidden />
                        {video.reps}
                      </span>
                      <span className="text-nimbli-muted">•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5 shrink-0 text-[#302d2d]" aria-hidden />
                        {video.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <p className="mt-8 text-center text-sm text-nimbli-muted">
            {!practiceId
              ? 'Log in met een kine-account om je eigen video’s te beheren.'
              : 'Nog geen oefeningen met geüploade video. Voeg er een toe of bekijk overige oefeningen onder Bibliotheek.'}
          </p>
        ) : null}
      </div>

      <AddExerciseDialog
        open={addExerciseOpen}
        onOpenChange={setAddExerciseOpen}
        practiceId={practiceId}
        onSaved={refetch}
      />
    </div>
  )
}
