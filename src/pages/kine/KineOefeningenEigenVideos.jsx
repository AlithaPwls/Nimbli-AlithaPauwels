import { useMemo, useState } from 'react'
import { CirclePlay, Clock, Plus, Repeat2 } from 'lucide-react'
import KineOefeningenModeSwitch from '@/components/kine/KineOefeningenModeSwitch.jsx'

const THUMB_BLIKSEM =
  'https://www.figma.com/api/mcp/asset/0f742793-63ba-457a-a6a5-01d7f798952f'
const THUMB_REGENBOOG =
  'https://www.figma.com/api/mcp/asset/829f0d87-faa0-477d-9185-662bcce11d43'

const MOCK_VIDEOS = [
  {
    id: '1',
    title: 'Bliksem klimmer',
    category: 'kracht',
    categoryLabel: 'Kracht',
    tagClass: 'bg-[#ffc1f9]',
    difficulty: 'Gemiddeld',
    reps: '10x herhalingen',
    duration: '10 min',
    thumb: THUMB_BLIKSEM,
  },
  {
    id: '2',
    title: 'Regenboog stretch',
    category: 'mobiliteit',
    categoryLabel: 'Mobiliteit',
    tagClass: 'bg-[#FBB92A]',
    difficulty: 'Makkelijk',
    reps: '12x herhalingen',
    duration: '3 min',
    thumb: THUMB_REGENBOOG,
  },
  {
    id: '3',
    title: 'Flamingo pose',
    category: 'balans',
    categoryLabel: 'Balans',
    tagClass: 'bg-[#BDE786]',
    difficulty: 'Gemiddeld',
    reps: '12x herhalingen',
    duration: '5 min',
    thumb: THUMB_REGENBOOG,
  },
]

const FILTER_CHIPS = [
  { id: 'all', label: 'Alle oefeningen' },
  { id: 'mobiliteit', label: 'Mobiliteit' },
  { id: 'kracht', label: 'Kracht' },
  { id: 'balans', label: 'Balans' },
]

export default function KineOefeningenEigenVideos() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MOCK_VIDEOS.filter((row) => {
      if (category !== 'all' && row.category !== category) return false
      if (!q) return true
      return row.title.toLowerCase().includes(q)
    })
  }, [query, category])

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-nimbli-ink">
            Oefeningen bibliotheek
          </h1>
        </div>
        <KineOefeningenModeSwitch />
      </div>

      <div className="mt-6 rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3]">
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
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded border border-transparent bg-nimbli px-5 font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
          >
            <Plus className="size-[18px] shrink-0" strokeWidth={2.5} aria-hidden />
            Oefening toevoegen
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {filtered.map((video) => (
            <button
              key={video.id}
              type="button"
              className="w-full rounded-[14px] border-2 border-[#e1dbd3] bg-white p-6 pt-[25px] text-left shadow-[0_2px_0_0_#e1dbd3] transition-colors hover:border-nimbli/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
                  <img
                    src={video.thumb}
                    alt=""
                    className="h-full w-full scale-105 object-cover blur-[1px]"
                    loading="lazy"
                    decoding="async"
                  />
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

        {filtered.length === 0 ? (
          <p className="mt-8 text-center text-sm text-nimbli-muted">Geen oefeningen gevonden.</p>
        ) : null}
      </div>
    </div>
  )
}
