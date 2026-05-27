function toInt(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.round(v))
}

function maxOf(points) {
  const list = Array.isArray(points) ? points : []
  const m = Math.max(0, ...list.map((x) => toInt(x)))
  return m || 1
}

const w = 520
const h = 160
const padX = 18
const padY = 16
const FALLBACK_POINTS = [0, 1, 3, 3, 2, 0, 0]
const FALLBACK_DAYS = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO']

export default function OuderMiniLineChart({
  points = FALLBACK_POINTS,
  days = FALLBACK_DAYS,
  dayDates = null,
}) {
  const safePoints = Array.isArray(points) && points.length === 7 ? points.map(toInt) : FALLBACK_POINTS
  const safeDays = Array.isArray(days) && days.length === 7 ? days : FALLBACK_DAYS
  const safeDates = Array.isArray(dayDates) && dayDates.length === 7 ? dayDates : null
  const max = maxOf(safePoints)
  const sx = (i) => padX + (i * (w - padX * 2)) / (safePoints.length - 1)
  const sy = (v) => padY + (1 - v / max) * (h - padY * 2)
  const poly = safePoints.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <div className="min-h-[220px] w-full flex-1">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${w} ${h}`}
          className="block h-full min-h-[220px] w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            points={poly}
            fill="none"
            stroke="#2BB39B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="grid shrink-0 grid-cols-7 gap-1">
        {safeDays.map((day, i) => (
          <div key={`${day}-${i}`} className="flex flex-col items-center">
            <span className="text-[10px] font-medium leading-none text-[#6b7280]">{day}</span>
            {safeDates ? (
              <span className="mt-0.5 text-[9px] leading-none text-[#9ca3af]">{safeDates[i]}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
