import { ArrowLeft, Play, Square, Volume2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth.js'
import { useKindExerciseDetail } from '@/hooks/kind/useKindExerciseDetail.js'
import { applyActiveChildToParams, readActiveChildId, withChildSearch } from '@/lib/activeChild.js'
import { useSpeechGuide } from '@/hooks/kind/useSpeechGuide.js'
import { routineFromExerciseTitle } from '@/lib/kind/routineFromExerciseTitle.js'

function routineFromPoseConfig(poseEnabled, poseConfig) {
  if (!poseEnabled || !poseConfig) return null
  const type = typeof poseConfig?.type === 'string' ? poseConfig.type : null
  if (type === 'stretch_sterren') return 'stretchSterren'
  return null
}

function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false
  const u = url.toLowerCase()
  return u.includes('youtu.be') || u.includes('youtube.com')
}

function youtubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null
  const t = url.trim()
  const m1 = t.match(/youtu\.be\/([^?]+)/)
  const m2 = t.match(/[?&]v=([^&]+)/)
  const id = (m1?.[1] || m2?.[1] || '').trim()
  if (!id) return null
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1&mute=1`
}

function isDirectVideoUrl(url) {
  if (!url || typeof url !== 'string') return false
  const u = url.trim().toLowerCase()
  const path = u.split(/[?#]/)[0]
  return (
    path.endsWith('.mp4') ||
    path.endsWith('.webm') ||
    path.endsWith('.mov') ||
    path.endsWith('.m4v') ||
    path.endsWith('.ogg') ||
    u.includes('/exercise-videos/')
  )
}

function formatDurationLabel(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const m = Math.max(1, Math.ceil(seconds / 60))
  return `${m} min`
}

function StatCard({ label, value, valueClassName }) {
  return (
    <div className="flex h-[126px] w-full flex-col items-start gap-2 rounded-2xl border-2 border-kind-border bg-kind-white px-[33px] pt-[33px] pb-px shadow-[0px_2px_0px_#e1dbd3] max-lg:h-auto max-lg:px-5 max-lg:py-5">
      <p className="w-full text-center font-nimbli-body text-[18px] font-normal leading-[25.2px] text-[#6a7282] max-lg:text-base max-lg:leading-snug">
        {label}
      </p>
      <p className={cn('w-full text-center font-sans text-2xl font-bold leading-8 max-lg:text-xl max-lg:leading-7', valueClassName)}>
        {value}
      </p>
    </div>
  )
}

export default function Exercise() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { role } = useAuth()
  const { state } = useLocation()
  const parentChildId = role === 'parent' ? readActiveChildId(searchParams) : null

  const fromState = state?.exercise
  const exerciseId = searchParams.get('exerciseId') || fromState?.id || null
  const assignmentId = searchParams.get('assignmentId') || fromState?.assignmentId || null

  const { data, loading, error } = useKindExerciseDetail(exerciseId, assignmentId)
  const { supported: speechSupported, speaking, speak, cancel } = useSpeechGuide()

  const title = data?.title ?? (loading ? 'Laden…' : 'Oefening')
  const repsDisplay = data?.repsLine ?? '—'
  const niveau = data?.difficulty ?? '—'
  const beloning = data?.xpValue != null ? `+${data.xpValue} XP` : '—'
  const descriptionText = (data?.descriptionDisplay ?? '').trim()
  const durationLabel = formatDurationLabel(data?.durationSeconds)

  const posterSrc = data?.thumbnailUrl || data?.imageUrl
  const mediaUrl = data?.videoUrl || data?.mediaUrl || null
  const showYouTube = Boolean(mediaUrl && isYouTubeUrl(mediaUrl) && youtubeEmbedUrl(mediaUrl))
  const showDirectVideo = Boolean(mediaUrl && !showYouTube && isDirectVideoUrl(mediaUrl))
  const ytEmbed = showYouTube ? youtubeEmbedUrl(mediaUrl) : null
  const speechText = [title, descriptionText].filter((text) => text && text !== '—').join('. ')

  function handleListenClick() {
    if (speaking) {
      cancel()
      return
    }
    speak(speechText)
  }

  const goToPoseDetection = () => {
    const qs = new URLSearchParams()
    qs.set('exerciseId', exerciseId)
    if (assignmentId) qs.set('assignmentId', assignmentId)
    const routine =
      routineFromPoseConfig(data?.poseEnabled, data?.poseConfig) ??
      routineFromExerciseTitle(data?.title)
    if (routine) qs.set('routine', routine)
    if (data?.repsTarget != null && Number.isFinite(Number(data.repsTarget))) {
      qs.set('reps', String(Math.max(1, Math.round(Number(data.repsTarget)))))
    }
    if (data?.xpValue != null && Number.isFinite(Number(data.xpValue))) {
      qs.set('xp', String(Math.max(0, Math.round(Number(data.xpValue)))))
    }
    applyActiveChildToParams(qs, parentChildId)
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
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex w-full min-w-0 max-w-[1240px] flex-col gap-12 px-7 pb-12 pt-10 max-lg:gap-8 max-lg:px-4 max-lg:py-6">
          {error ? (
            <p className="rounded-lg border border-kind-border bg-kind-white px-4 py-3 font-nimbli-body text-sm text-kind-red">
              {typeof error?.message === 'string' && error.message
                ? error.message
                : 'Deze oefening kon niet worden geladen.'}
            </p>
          ) : null}

          <div className="flex flex-row items-start gap-12 max-lg:flex-col max-lg:gap-8">
            <div className="flex min-w-0 flex-1 gap-10 max-lg:flex-col max-lg:gap-6">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    parentChildId ? withChildSearch('/dashboard/kind', parentChildId) : '/dashboard/kind'
                  )
                }
                className="inline-flex h-fit w-fit shrink-0 items-center gap-2 self-start rounded-sm pt-1.5 text-nimbli-ink transition-colors hover:text-kind-green-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas max-lg:pt-0"
              >
                <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
                <span className="font-nimbli-heading text-[18px] font-bold leading-[25.2px] max-lg:text-base">Terug</span>
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-[30px] lg:max-w-[780px] max-lg:gap-6">
                <h1 className="min-w-0 font-nimbli-heading text-[36px] font-extrabold leading-10 text-nimbli-ink max-lg:text-[28px] max-lg:leading-9 max-sm:text-2xl max-sm:leading-8">
                  {title}
                </h1>
              <div className="relative flex aspect-[780/404] w-full min-h-[280px] max-h-[404px] items-center justify-center overflow-hidden rounded-[24px] bg-[#6c6c6c] max-lg:min-h-[200px] max-lg:max-h-[min(45vh,320px)] max-lg:rounded-2xl">
                {showYouTube && ytEmbed ? (
                  <iframe
                    title="Oefenvideo"
                    className="absolute inset-0 size-full"
                    src={ytEmbed}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : showDirectVideo ? (
                  <video
                    key={mediaUrl}
                    className="absolute inset-0 size-full object-cover"
                    src={mediaUrl}
                    autoPlay
                    controls
                    muted
                    playsInline
                    preload="auto"
                    poster={posterSrc || undefined}
                  />
                ) : posterSrc ? (
                  <img
                    src={posterSrc}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    width={780}
                    height={404}
                  />
                ) : null}

                {/* If we’re not showing a playable video, keep the visual play affordance. */}
                {!showYouTube && !showDirectVideo ? (
                  <div
                    className="relative z-10 grid size-[136px] shrink-0 place-items-center rounded-full bg-white/20 max-lg:size-24"
                    aria-hidden
                  >
                    <Play className="ml-1 size-16 text-white drop-shadow-sm max-lg:size-12" fill="currentColor" strokeWidth={0} />
                  </div>
                ) : null}
              </div>

              <div className="w-full rounded-2xl border-l-2 border-kind-border bg-kind-white py-[30px] pl-10 pr-8 shadow-[0px_2px_0px_#e1dbd3] max-lg:py-6 max-lg:pl-6 max-lg:pr-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="min-w-0 flex-1 font-nimbli-heading text-[18px] font-bold text-[#364153] max-lg:text-base">
                    Hoe doe je deze oefening?
                  </h2>
                  <button
                    type="button"
                    disabled={!speechSupported || loading || !descriptionText}
                    onClick={handleListenClick}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-kind-yellow font-nimbli-heading text-sm font-black text-nimbli-ink shadow-[0_2px_0_0_#d08700] transition-colors hover:bg-kind-yellow/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-yellow focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 max-lg:size-10 max-lg:p-0 lg:min-h-10 lg:px-4 lg:py-2"
                    aria-label={speaking ? 'Stop voorlezen' : 'Lees de uitleg voor'}
                  >
                    {speaking ? (
                      <Square className="size-4" aria-hidden fill="currentColor" />
                    ) : (
                      <Volume2 className="size-4" aria-hidden />
                    )}
                    <span className="hidden lg:inline">{speaking ? 'Stop' : 'Luister'}</span>
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line font-nimbli-body text-base font-normal leading-normal text-[#101828] max-lg:text-sm max-lg:leading-relaxed">
                  {loading && !data ? 'Laden…' : descriptionText || '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={goToPoseDetection}
                className="h-16 w-full rounded-xl border-0 bg-kind-green-primary font-nimbli-heading text-[17.75px] font-black leading-none text-kind-canvas shadow-[0_4px_0_0_#1e7a6a] transition-colors hover:bg-kind-green-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas max-lg:h-14 max-lg:text-base"
              >
                Start oefening
              </button>

              <aside className="grid w-full grid-cols-2 gap-4 lg:hidden">
                <StatCard label="Herhalingen" value={loading && !data ? '…' : repsDisplay} valueClassName="text-[#101828]" />
                <StatCard label="Beloning" value={loading && !data ? '…' : beloning} valueClassName="text-[#d08700]" />
                <StatCard label="Niveau" value={loading && !data ? '…' : niveau} valueClassName="text-[#00a63e]" />
                <StatCard label="Duur" value={loading && !data ? '…' : durationLabel} valueClassName="text-[#ca0000]" />
              </aside>
              </div>
            </div>

            <aside className="hidden w-[250px] shrink-0 flex-col gap-6 lg:flex">
              <StatCard label="Herhalingen" value={loading && !data ? '…' : repsDisplay} valueClassName="text-[#101828]" />
              <StatCard label="Beloning" value={loading && !data ? '…' : beloning} valueClassName="text-[#d08700]" />
              <StatCard label="Niveau" value={loading && !data ? '…' : niveau} valueClassName="text-[#00a63e]" />
              <StatCard label="Duur" value={loading && !data ? '…' : durationLabel} valueClassName="text-[#ca0000]" />
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
