import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlarmClock, Check, Lock, Moon, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import pathMainSvg from '@/assets/kind-path-figma.svg'
import pathLowerSvg from '@/assets/kind-path-figma-lower.svg'
import KindTodayExercisesPanel from '@/components/kind/KindTodayExercisesPanel.jsx'

function Marker({ className, Icon, label, variant = 'neutral', labelClassName, onClick }) {
  const IconComponent = Icon
  const interactive = typeof onClick === 'function'
  const Root = interactive ? 'button' : 'div'

  const iconWrapClass =
    variant === 'warn'
      ? 'bg-kind-red text-kind-white'
      : variant === 'ok'
        ? 'bg-kind-green-success text-kind-white'
        : variant === 'completed'
          ? 'bg-kind-light-gray text-kind-white'
          : variant === 'today'
            ? 'bg-kind-yellow text-kind-white'
            : variant === 'sleep'
              ? 'bg-kind-blue text-kind-white'
              : variant === 'locked'
                ? 'bg-kind-light-gray text-kind-gray'
                : 'bg-kind-white text-nimbli-ink'

  return (
    <Root
      {...(interactive
        ? {
            type: 'button',
            onClick,
            'aria-label': label ? `Open oefeningen: ${label}` : 'Open oefeningen van vandaag',
          }
        : {})}
      className={cn(
        'absolute flex flex-col items-center',
        interactive &&
          'pointer-events-auto cursor-pointer border-0 bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas',
        className
      )}
    >
      {variant === 'today' ? (
        <div className="relative grid size-[96px] place-items-center rounded-full">
          <div
            className="absolute -inset-1 rounded-full border-2 border-dashed border-kind-yellow"
            aria-hidden
          />
          <div className="absolute inset-[8px] rounded-full bg-kind-yellow shadow-[0_10px_22px_rgba(0,0,0,0.12)]" />
          <div className="absolute inset-[14px] grid place-items-center rounded-full bg-kind-yellow ring-4 ring-kind-white" />
          <Star className="relative z-10 size-9 text-kind-white" fill="currentColor" aria-hidden />
        </div>
      ) : (
        <div
          className={cn(
            'grid size-[68px] place-items-center rounded-full shadow-[0_10px_22px_rgba(0,0,0,0.08)] ring-1 ring-black/5',
            iconWrapClass
          )}
        >
          <IconComponent className="size-8" aria-hidden />
        </div>
      )}
      {label ? (
        <span
          className={cn(
            'mt-2 max-w-[110px] text-center font-nimbli-body text-sm font-normal leading-tight text-kind-black',
            labelClassName
          )}
        >
          {label}
        </span>
      ) : null}
    </Root>
  )
}

function PathSegment({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      width={439}
      height={797}
      className="relative z-0 block w-full max-w-[412px] select-none"
      draggable={false}
      decoding="async"
    />
  )
}

export default function KindProgressPath({ monthLabel = 'Januari' }) {
  const navigate = useNavigate()
  const [todayPanelOpen, setTodayPanelOpen] = useState(false)
  const [todayAnchorRect, setTodayAnchorRect] = useState(null)

  const openTodayPanel = useCallback((event) => {
    setTodayAnchorRect(event.currentTarget.getBoundingClientRect())
    setTodayPanelOpen(true)
  }, [])

  const closeTodayPanel = useCallback(() => {
    setTodayPanelOpen(false)
    setTodayAnchorRect(null)
  }, [])

  const onStartExercise = useCallback(
    (exercise) => {
      closeTodayPanel()
      const qs = new URLSearchParams()
      qs.set('exerciseId', exercise.id)
      if (exercise.assignmentId) qs.set('assignmentId', exercise.assignmentId)
      navigate({ pathname: '/dashboard/kind/oefening', search: `?${qs.toString()}` }, { state: { exercise } })
    },
    [closeTodayPanel, navigate]
  )

  return (
    <div className="flex flex-col items-center px-4 pb-16 pt-4 sm:px-6">
      <section className="relative w-full max-w-[412px]" aria-label="Voortgang vandaag">
        <PathSegment src={pathMainSvg} alt="" />

        <div className="pointer-events-none absolute inset-0">
          <Marker
            className="left-[24%] top-[4.5%] -translate-x-1/2"
            Icon={AlarmClock}
            label="ZA"
            variant="warn"
          />
          <Marker
            className="left-[57%] top-[19%] -translate-x-1/2"
            Icon={Check}
            label="DI"
            variant="ok"
          />
          <Marker
            className="left-[27%] top-[33%] -translate-x-1/2"
            Icon={Star}
            label="VANDAAG"
            variant="today"
            labelClassName="text-xs font-normal"
            onClick={openTodayPanel}
          />
          <Marker
            className="left-[57%] top-[50%] -translate-x-1/2"
            Icon={Moon}
            label="VR"
            variant="sleep"
          />
          <Marker
            className="left-[24%] top-[66%] -translate-x-1/2"
            Icon={Moon}
            label="VR"
            variant="sleep"
          />

          <p className="absolute left-[58%] top-[77%] -translate-x-1/2 font-nimbli-heading text-[26px] font-bold italic leading-tight tracking-tight text-[#6c6c6c]">
            {monthLabel}
          </p>

          <Marker
            className="left-[57%] top-[83%] -translate-x-1/2"
            Icon={Lock}
            label="DO"
            variant="locked"
          />
        </div>
      </section>

      <KindTodayExercisesPanel
        open={todayPanelOpen}
        anchorRect={todayAnchorRect}
        onClose={closeTodayPanel}
        onStartExercise={onStartExercise}
      />

      <section className="relative -mt-1 w-full max-w-[412px]" aria-label="Eerdere dagen">
        <PathSegment src={pathLowerSvg} alt="" />

        <div className="pointer-events-none absolute inset-0">
          <Marker
            className="left-[24%] top-[6%] -translate-x-1/2"
            Icon={Check}
            label="ZO"
            variant="completed"
          />
          <Marker
            className="left-[57%] top-[20%] -translate-x-1/2"
            Icon={Check}
            label="MA"
            variant="completed"
          />
          <Marker
            className="left-[24%] top-[34%] -translate-x-1/2"
            Icon={Check}
            label="DI"
            variant="completed"
          />
          <Marker
            className="left-[57%] top-[49%] -translate-x-1/2"
            Icon={Check}
            label="WO"
            variant="completed"
          />
          <Marker
            className="left-[24%] top-[67%] -translate-x-1/2"
            Icon={Check}
            label="DO"
            variant="completed"
          />
          <Marker
            className="left-[57%] top-[82%] -translate-x-1/2"
            Icon={Check}
            label="VR"
            variant="completed"
          />
        </div>
      </section>
    </div>
  )
}
