import { ArrowLeft, Play } from 'lucide-react'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type TodayExercise = {
  id: string
  title: string
  category: string
  difficulty: string
  reps: string
  image: string
}

type LocationState = {
  exercise?: TodayExercise
}

const INSTRUCTION_FALLBACK =
  'Volg de beweging rustig en stop als je je niet lekker voelt. Vraag hulp aan een volwassene als dat nodig is.'

const INSTRUCTION_BY_TITLE: Record<string, string> = {
  'Jumping jacks':
    'Spring met je armen en benen uit elkaar! Houd je rug recht en land zachtjes op je voeten.',
  'Superheld pose': 'Sta stevig, armen naar de zijkant, borst vooruit. Houd even vast en adem rustig.',
  'Balans brug': 'Ga op je rug liggen, duw je heupen rustig omhoog en houd je evenwicht.',
  'Stretch naar de sterren': 'Reik met beide armen omhoog alsof je sterren plukt. Rek lang uit.',
}

function formatRepsLabel(reps?: string) {
  if (!reps) return '10x'
  const m = reps.match(/(\d+)/)
  return m ? `${m[1]}x` : reps
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName: string
}) {
  return (
    <div className="flex h-[126px] w-full flex-col items-start gap-2 rounded-2xl border-2 border-kind-border bg-kind-white px-[33px] pt-[33px] pb-px shadow-[0px_2px_0px_#e1dbd3]">
      <p className="w-full text-center font-nimbli-body text-[18px] font-normal leading-[25.2px] text-[#6a7282]">
        {label}
      </p>
      <p
        className={`w-full text-center font-sans text-2xl font-bold leading-8 ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  )
}

export default function Exercise() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: LocationState | null }

  const exercise = state?.exercise

  const title = exercise?.title ?? 'Jumping Jacks'
  const repsDisplay = useMemo(() => formatRepsLabel(exercise?.reps), [exercise?.reps])
  const niveau = exercise?.difficulty ?? 'Makkelijk'
  const instruction = useMemo(() => {
    if (!exercise?.title) return INSTRUCTION_BY_TITLE['Jumping jacks'] ?? INSTRUCTION_FALLBACK
    return INSTRUCTION_BY_TITLE[exercise.title] ?? INSTRUCTION_FALLBACK
  }, [exercise?.title])

  return (
    <div className="flex min-h-svh flex-col bg-kind-canvas" data-page="kind-exercise">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:gap-12 lg:px-7 lg:pb-12 lg:pt-10">
          <div className="flex min-w-0 flex-1 flex-col lg:max-w-[780px]">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:gap-10 lg:mb-10">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-sm text-nimbli-ink transition-colors hover:text-kind-green-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas"
              >
                <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
                <span className="font-nimbli-heading text-[18px] font-bold leading-[25.2px]">Terug</span>
              </button>
              <h1 className="min-w-0 font-nimbli-heading text-[36px] font-extrabold leading-10 text-nimbli-ink sm:flex-1 sm:pt-0.5">
                {title}
              </h1>
            </div>

            <div className="flex w-full flex-col items-center gap-[30px]">

              <div className="relative flex aspect-[780/404] w-full max-h-[min(50vh,404px)] min-h-[200px] items-center justify-center overflow-hidden rounded-[24px] bg-[#6c6c6c] sm:max-h-[404px] sm:min-h-[280px]">
                <button
                  type="button"
                  className="grid size-[136px] shrink-0 place-items-center rounded-full bg-white/20 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6c6c6c]"
                  aria-label="Video afspelen"
                >
                  <Play
                    className="ml-1 size-16 text-white drop-shadow-sm"
                    fill="currentColor"
                    strokeWidth={0}
                    aria-hidden
                  />
                </button>
              </div>

              <div className="w-full rounded-2xl border-l-2 border-kind-border bg-kind-white py-[30px] pl-10 pr-8 shadow-[0px_2px_0px_#e1dbd3]">
                <h2 className="font-nimbli-heading text-[18px] font-bold text-[#364153]">
                  Hoe doe je deze oefening?
                </h2>
                <p className="mt-2 font-nimbli-body text-base font-normal leading-normal text-[#101828]">
                  {instruction}
                </p>
              </div>

              <button
                type="button"
                className="h-16 w-full max-w-[774px] rounded-xl border-0 bg-kind-green-primary font-nimbli-heading text-[17.75px] font-black leading-none text-kind-canvas shadow-[0_4px_0_0_#1e7a6a] transition-colors hover:bg-kind-green-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas"
              >
                Start oefening
              </button>
            </div>
          </div>

          <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[250px] lg:gap-6">
            <StatCard label="Herhalingen" value={repsDisplay} valueClassName="text-[#101828]" />
            <StatCard label="Beloning" value="+50 XP" valueClassName="text-[#d08700]" />
            <StatCard label="Niveau" value={niveau} valueClassName="text-[#00a63e]" />
            <StatCard label="Ruimte" value="Staand, 1m²" valueClassName="text-[#ca0000]" />
          </aside>
        </div>
      </div>
    </div>
  )
}
