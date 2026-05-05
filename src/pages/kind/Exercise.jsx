import { ArrowLeft, Play } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useKindExerciseDetail } from '@/hooks/kind/useKindExerciseDetail.js'
import { routineFromExerciseTitle } from '@/lib/kind/routineFromExerciseTitle.js'

function formatDurationLabel(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const m = Math.max(1, Math.ceil(seconds / 60))
  return `${m} min`
}

function StatCard({ label, value, valueClassName }) {
  return (
    <div className="flex h-[126px] w-full flex-col items-start gap-2 rounded-2xl border-2 border-kind-border bg-kind-white px-[33px] pt-[33px] pb-px shadow-[0px_2px_0px_#e1dbd3]">
      <p className="w-full text-center font-nimbli-body text-[18px] font-normal leading-[25.2px] text-[#6a7282]">
        {label}
      </p>
      <p className={cn('w-full text-center font-sans text-2xl font-bold leading-8', valueClassName)}>
        {value}
      </p>
    </div>
  )
}

export default function Exercise() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { state } = useLocation()

  const fromState = state?.exercise
  const exerciseId = searchParams.get('exerciseId') || fromState?.id || null
  const assignmentId = searchParams.get('assignmentId') || fromState?.assignmentId || null

  const { data, loading, error } = useKindExerciseDetail(exerciseId, assignmentId)

  const title = data?.title ?? (loading ? 'Laden…' : 'Oefening')
  const repsDisplay = data?.repsLine ?? '—'
  const niveau = data?.difficulty ?? '—'
  const beloning = data?.xpValue != null ? `+${data.xpValue} XP` : '—'
  const descriptionText = (data?.descriptionDisplay ?? '').trim()
  const durationLabel = formatDurationLabel(data?.durationSeconds)

  const posterSrc = data?.thumbnailUrl || data?.mediaUrl || data?.imageUrl

  const goToPoseDetection = () => {
    const qs = new URLSearchParams()
    qs.set('exerciseId', exerciseId)
    if (assignmentId) qs.set('assignmentId', assignmentId)
    const routine = routineFromExerciseTitle(data?.title)
    if (routine) qs.set('routine', routine)
    if (data?.repsTarget != null && Number.isFinite(Number(data.repsTarget))) {
      qs.set('reps', String(Math.max(1, Math.round(Number(data.repsTarget)))))
    }
    navigate({ pathname: '/dashboard/kind/oefening/pose', search: `?${qs.toString()}` })
  }

  if (!exerciseId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-kind-canvas px-4" data-page="kind-exercise">
        <p className="text-center font-nimbli-body text-nimbli-ink">Geen oefening geselecteerd.</p>
        <Link
          to="/dashboard/kind"
          className="font-nimbli-heading text-kind-green-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary"
        >
          Terug naar je pad
        </Link>
      </div>
    )
  }

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

            {error ? (
              <p className="rounded-lg border border-kind-border bg-kind-white px-4 py-3 font-nimbli-body text-sm text-kind-red">
                {typeof error?.message === 'string' && error.message
                  ? error.message
                  : 'Deze oefening kon niet worden geladen.'}
              </p>
            ) : null}

            <div className="flex w-full flex-col items-center gap-[30px]">
              <div className="relative flex aspect-[780/404] w-full max-h-[min(50vh,404px)] min-h-[200px] items-center justify-center overflow-hidden rounded-[24px] bg-[#6c6c6c] sm:max-h-[404px] sm:min-h-[280px]">
                {posterSrc ? (
                  <img
                    src={posterSrc}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    width={780}
                    height={404}
                  />
                ) : null}
                <button
                  type="button"
                  className="relative z-10 grid size-[136px] shrink-0 place-items-center rounded-full bg-white/20 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6c6c6c]"
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
                <p className="mt-2 whitespace-pre-line font-nimbli-body text-base font-normal leading-normal text-[#101828]">
                  {loading && !data ? 'Laden…' : descriptionText || '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={goToPoseDetection}
                className="h-16 w-full max-w-[774px] rounded-xl border-0 bg-kind-green-primary font-nimbli-heading text-[17.75px] font-black leading-none text-kind-canvas shadow-[0_4px_0_0_#1e7a6a] transition-colors hover:bg-kind-green-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas"
              >
                Start oefening
              </button>
            </div>
          </div>

          <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[250px] lg:gap-6">
            <StatCard label="Herhalingen" value={loading && !data ? '…' : repsDisplay} valueClassName="text-[#101828]" />
            <StatCard label="Beloning" value={loading && !data ? '…' : beloning} valueClassName="text-[#d08700]" />
            <StatCard label="Niveau" value={loading && !data ? '…' : niveau} valueClassName="text-[#00a63e]" />
            <StatCard label="Duur" value={loading && !data ? '…' : durationLabel} valueClassName="text-[#ca0000]" />
          </aside>
        </div>
      </div>
    </div>
  )
}
