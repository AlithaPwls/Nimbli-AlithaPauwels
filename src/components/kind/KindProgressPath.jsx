import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { applyActiveChildToParams, resolveKindRouteChildId } from '@/lib/activeChild.js'
import { useAuth } from '@/hooks/useAuth.js'
import { AlarmClock, Check, Lock, Moon, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import pathMainSvg from '@/assets/kind-path-figma.svg'
import pathLowerSvg from '@/assets/kind-path-figma-lower.svg'
import KindTodayExercisesPanel from '@/components/kind/KindTodayExercisesPanel.jsx'
import { useKindOverviewWeekChart } from '@/hooks/kind/useKindOverviewWeekChart.js'
import {
  PATH_MAIN_MONTH_SLOT,
  PATH_MAIN_TODAY_SLOT,
  buildPathMarkersFromWeekDays,
  getLowerPathClipPercent,
  getPathSegmentClipPercent,
  kindPathMonthLabel,
} from '@/lib/kind/weekCalendar.js'

const VARIANT_ICONS = {
  warn: AlarmClock,
  ok: Check,
  completed: Check,
  sleep: Moon,
  locked: Lock,
}

const MARKER_ICON_MOTION =
  'transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:shadow-none'

const MARKER_ICON_HOVER =
  'group-hover/marker:-translate-y-1 group-hover/marker:shadow-[0_14px_28px_rgba(0,0,0,0.14)] group-focus-visible/marker:-translate-y-1 group-focus-visible/marker:shadow-[0_14px_28px_rgba(0,0,0,0.14)]'

const MARKER_LABEL_MOTION =
  'transition-[color,font-weight] duration-200 ease-out motion-reduce:transition-none group-hover/marker:font-semibold group-hover/marker:text-kind-black'

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
        'group/marker absolute flex flex-col items-center',
        interactive
          ? 'pointer-events-auto cursor-pointer border-0 bg-transparent p-0 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas'
          : 'pointer-events-auto cursor-default',
        className
      )}
    >
      {variant === 'today' ? (
        <div
          className={cn(
            'relative grid size-[96px] place-items-center rounded-full',
            MARKER_ICON_MOTION,
            MARKER_ICON_HOVER
          )}
        >
          <div
            className="absolute -inset-1 rounded-full border-2 border-dashed border-kind-yellow transition-[border-color,transform] duration-200 ease-out group-hover/marker:scale-105 group-hover/marker:border-[#d4a017] motion-reduce:group-hover/marker:scale-100 motion-reduce:transition-none"
            aria-hidden
          />
          <div className="absolute inset-[8px] rounded-full bg-kind-yellow shadow-[0_10px_22px_rgba(0,0,0,0.12)]" />
          <div className="absolute inset-[14px] grid place-items-center rounded-full bg-kind-yellow ring-4 ring-kind-white transition-transform duration-200 ease-out group-hover/marker:scale-105 motion-reduce:group-hover/marker:scale-100 motion-reduce:transition-none" />
          <Star
            className="relative z-10 size-9 text-kind-white transition-transform duration-200 ease-out group-hover/marker:scale-110 motion-reduce:group-hover/marker:scale-100 motion-reduce:transition-none"
            fill="currentColor"
            aria-hidden
          />
        </div>
      ) : (
        <div
          className={cn(
            'grid size-[68px] place-items-center rounded-full shadow-[0_10px_22px_rgba(0,0,0,0.08)] ring-1 ring-black/5',
            MARKER_ICON_MOTION,
            MARKER_ICON_HOVER,
            iconWrapClass
          )}
        >
          <IconComponent
            className="size-8 transition-transform duration-200 ease-out group-hover/marker:scale-110 motion-reduce:group-hover/marker:scale-100 motion-reduce:transition-none"
            aria-hidden
          />
        </div>
      )}
      {label ? (
        <span
          className={cn(
            'mt-2 max-w-[110px] text-center font-nimbli-body font-normal leading-tight text-kind-black',
            MARKER_LABEL_MOTION,
            labelClassName
          )}
        >
          {label}
        </span>
      ) : null}
    </Root>
  )
}

const PATH_VIEW_HEIGHT = 796.578

function PathSegment({ src, alt, clipPercent = 100 }) {
  const clipped = clipPercent < 100
  const clipHeight = (PATH_VIEW_HEIGHT * clipPercent) / 100

  if (!clipped) {
    return (
      <img
        src={src}
        alt={alt}
        width={439}
        height={797}
        className="relative z-0 block h-auto w-full select-none"
        draggable={false}
        decoding="async"
      />
    )
  }

  return (
    <div
      className="relative z-0 w-full overflow-hidden"
      style={{ aspectRatio: `438.967 / ${clipHeight}` }}
    >
      <img
        src={src}
        alt={alt}
        width={439}
        height={797}
        className="absolute left-0 top-0 block w-full max-w-none select-none"
        draggable={false}
        decoding="async"
      />
    </div>
  )
}

function PathDayMarker({ marker }) {
  const Icon = VARIANT_ICONS[marker.variant] ?? Check
  const isFullLabel = marker.labelMode === 'full'
  return (
    <Marker
      className={marker.className}
      Icon={Icon}
      label={marker.label}
      variant={marker.variant}
      labelClassName={isFullLabel ? 'text-[11px] sm:text-xs' : 'text-sm'}
    />
  )
}

function PathMarkersOverlay({ children }) {
  return <div className="pointer-events-none absolute inset-0 z-10">{children}</div>
}

export default function KindProgressPath() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { role, profile } = useAuth()
  const [todayPanelOpen, setTodayPanelOpen] = useState(false)
  const [todayAnchorRect, setTodayAnchorRect] = useState(null)
  const { weekDays } = useKindOverviewWeekChart()

  const monthLabel = useMemo(() => kindPathMonthLabel(new Date()), [])
  const pathMarkers = useMemo(() => buildPathMarkersFromWeekDays(weekDays), [weekDays])
  const upperClipPercent = useMemo(
    () => getPathSegmentClipPercent(pathMarkers.upperPath.length),
    [pathMarkers.upperPath.length]
  )
  const lowerClipPercent = useMemo(
    () => getLowerPathClipPercent(pathMarkers.lowerPath.length),
    [pathMarkers.lowerPath.length]
  )

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
      applyActiveChildToParams(
        qs,
        resolveKindRouteChildId({ role, profile, searchParams })
      )
      navigate({ pathname: '/dashboard/kind/oefening', search: `?${qs.toString()}` }, { state: { exercise } })
    },
    [closeTodayPanel, navigate, profile, role, searchParams]
  )

  return (
    <div className="mx-auto flex w-full max-w-[440px] min-w-0 flex-col items-center pb-16 pt-2 sm:max-w-[480px]">
      {pathMarkers.upperPath.length > 0 ? (
        <section className="relative -mb-1 w-full" aria-label="Eerdere dagen op het pad">
          <PathSegment src={pathMainSvg} alt="" clipPercent={upperClipPercent} />
          <PathMarkersOverlay>
            {pathMarkers.upperPath.map((marker) => (
              <PathDayMarker key={marker.key} marker={marker} />
            ))}
          </PathMarkersOverlay>
        </section>
      ) : null}

      <section className="relative w-full" aria-label="Voortgang deze week">
        <PathSegment src={pathMainSvg} alt="" />
        <PathMarkersOverlay>
          {pathMarkers.mainBeforeToday ? (
            <PathDayMarker key={pathMarkers.mainBeforeToday.key} marker={pathMarkers.mainBeforeToday} />
          ) : null}

          <Marker
            className={cn(PATH_MAIN_TODAY_SLOT.className, 'z-20')}
            Icon={Star}
            label="VANDAAG"
            variant="today"
            labelClassName="text-xs font-normal"
            onClick={openTodayPanel}
          />

          {pathMarkers.mainAfterToday.map((marker) => (
            <PathDayMarker key={marker.key} marker={marker} />
          ))}

          <p
            className={cn(
              'absolute font-nimbli-heading text-[26px] font-bold italic leading-tight tracking-tight text-[#6c6c6c]',
              PATH_MAIN_MONTH_SLOT.className
            )}
          >
            {monthLabel}
          </p>
        </PathMarkersOverlay>
      </section>

      {pathMarkers.lowerPath.length > 0 ? (
        <section className="relative -mt-[7%] w-full" aria-label="Komende dagen op het pad">
          <PathSegment src={pathLowerSvg} alt="" clipPercent={lowerClipPercent} />
          <PathMarkersOverlay>
            {pathMarkers.lowerPath.map((marker) => (
              <PathDayMarker key={marker.key} marker={marker} />
            ))}
          </PathMarkersOverlay>
        </section>
      ) : null}

      <KindTodayExercisesPanel
        open={todayPanelOpen}
        anchorRect={todayAnchorRect}
        onClose={closeTodayPanel}
        onStartExercise={onStartExercise}
      />
    </div>
  )
}
