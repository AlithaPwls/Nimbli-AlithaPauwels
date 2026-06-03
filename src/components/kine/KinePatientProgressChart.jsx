import { useEffect, useId, useRef, useState } from 'react'

const Y_LABELS = [100, 75, 50, 25, 0]
const CHART_HEIGHT = 220
const DAY_COUNT = 7
const PAD_X = 12
const PAD_TOP = 16
const PAD_BOTTOM = 36
const MIN_CHART_WIDTH = 280

function toInt(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

const FALLBACK_POINTS = [0, 0, 0, 0, 0, 0, 0]
const FALLBACK_DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const CHART_ACTIVE = '#2BB39B'
const DOT_ACTIVE = CHART_ACTIVE
const DOT_FUTURE = '#d1d5db'
const LABEL_FUTURE = '#9ca3af'
const LABEL_ACTIVE = '#6b7280'

function buildGeometry(width) {
  const W = Math.max(MIN_CHART_WIDTH, width)
  const H = CHART_HEIGHT
  const chartW = W - PAD_X * 2
  const chartH = H - PAD_TOP - PAD_BOTTOM
  const sx = (i) => PAD_X + ((i + 0.5) / DAY_COUNT) * chartW
  const sy = (v) => PAD_TOP + (1 - v / 100) * chartH
  const labelY = H - PAD_BOTTOM / 2
  return { W, H, chartW, chartH, sx, sy, labelY }
}

const FALLBACK_DETAILS = Array.from({ length: DAY_COUNT }, () => ({ title: '—' }))

export default function KinePatientProgressChart({
  points = FALLBACK_POINTS,
  days = FALLBACK_DAYS,
  dayStatuses = null,
  dayDetails = null,
}) {
  const gradientId = useId()
  const plotRef = useRef(null)
  const [plotWidth, setPlotWidth] = useState(MIN_CHART_WIDTH)
  const [activeIndex, setActiveIndex] = useState(null)

  const safePoints =
    Array.isArray(points) && points.length === DAY_COUNT ? points.map(toInt) : FALLBACK_POINTS
  const safeDays = Array.isArray(days) && days.length === DAY_COUNT ? days : FALLBACK_DAYS
  const safeStatuses =
    Array.isArray(dayStatuses) && dayStatuses.length === DAY_COUNT ? dayStatuses : null
  const safeDetails =
    Array.isArray(dayDetails) && dayDetails.length === DAY_COUNT ? dayDetails : FALLBACK_DETAILS

  useEffect(() => {
    const el = plotRef.current
    if (!el) return undefined

    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().width)
      if (next > 0) setPlotWidth(next)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { W, H, sx, sy, labelY } = buildGeometry(plotWidth)
  const chartBottom = H - PAD_BOTTOM
  const poly = safePoints.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')
  const areaPoly = `${PAD_X},${chartBottom} ${poly} ${W - PAD_X},${chartBottom}`

  const activeTooltip =
    activeIndex != null
      ? (safeDetails[activeIndex]?.title ??
        `${safeDays[activeIndex]}: ${safePoints[activeIndex]}%`)
      : null
  const activeIsFuture = activeIndex != null && safeStatuses?.[activeIndex] === 'future'
  const activeCy =
    activeIndex != null
      ? activeIsFuture
        ? chartBottom
        : sy(safePoints[activeIndex])
      : 0
  const activeXPct = activeIndex != null ? (sx(activeIndex) / W) * 100 : 0
  const activeYPct = activeIndex != null ? (activeCy / H) * 100 : 0

  return (
    <div className="flex w-full min-w-0 gap-2 max-sm:gap-1.5 sm:gap-3">
      <div className="flex h-[220px] w-11 shrink-0 flex-col justify-between py-1 text-[13px] text-[#9ca3af] max-sm:h-[180px] max-sm:w-9 max-sm:text-[11px]">
        {Y_LABELS.map((label) => (
          <span key={label}>{label}%</span>
        ))}
      </div>

      <div
        ref={plotRef}
        className="relative min-w-0 flex-1"
        onPointerLeave={() => setActiveIndex(null)}
      >
        {activeTooltip ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 max-w-[min(100%,16rem)] -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg border border-[#e1dbd3] bg-white px-2.5 py-1.5 text-xs font-semibold text-nimbli-ink shadow-md [left:var(--tooltip-x)] [top:var(--tooltip-y)]"
            style={{
              '--tooltip-x': `${activeXPct}%`,
              '--tooltip-y': `${activeYPct}%`,
            }}
          >
            {activeTooltip}
          </div>
        ) : null}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block h-[220px] w-full max-sm:h-[180px]"
          role="img"
          aria-label="Voortgang per dag van de week"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_ACTIVE} stopOpacity="0.4" />
              <stop offset="100%" stopColor={CHART_ACTIVE} stopOpacity="0" />
            </linearGradient>
          </defs>
          {Y_LABELS.map((label) => {
            const y = sy(label)
            return (
              <line
                key={label}
                x1={PAD_X}
                y1={y}
                x2={W - PAD_X}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            )
          })}
          <polygon points={areaPoly} fill={`url(#${gradientId})`} opacity="0.35" />
          <polyline
            points={poly}
            fill="none"
            stroke={CHART_ACTIVE}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {safePoints.map((v, i) => {
            const isFuture = safeStatuses?.[i] === 'future'
            const cx = sx(i)
            const cy = isFuture ? chartBottom : sy(v)
            const tooltip =
              safeDetails[i]?.title ?? `${safeDays[i]}: ${safePoints[i]}%`
            return (
              <g
                key={safeDays[i]}
                className="cursor-pointer"
                onPointerEnter={() => setActiveIndex(i)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r="12"
                  fill="transparent"
                  pointerEvents="all"
                  aria-label={tooltip}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill={isFuture ? DOT_FUTURE : DOT_ACTIVE}
                  pointerEvents="none"
                  aria-hidden
                />
              </g>
            )
          })}
          {safeDays.map((day, i) => {
            const isFuture = safeStatuses?.[i] === 'future'
            return (
              <text
                key={`${day}-label`}
                x={sx(i)}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isFuture ? LABEL_FUTURE : LABEL_ACTIVE}
                fontSize="13"
                style={{ fontFamily: 'var(--font-nimbli-body, sans-serif)' }}
              >
                {day}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
