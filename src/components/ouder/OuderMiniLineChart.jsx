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
const h = 112
const padX = 18
const padY = 16
const FALLBACK_POINTS = [0, 1, 3, 3, 2, 0, 0]
const FALLBACK_DAYS = ['Za', 'Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr']

export default function OuderMiniLineChart({ points = FALLBACK_POINTS, days = FALLBACK_DAYS }) {
  const safePoints = Array.isArray(points) && points.length === 7 ? points.map(toInt) : FALLBACK_POINTS
  const safeDays = Array.isArray(days) && days.length === 7 ? days : FALLBACK_DAYS
  const max = maxOf(safePoints)
  const sx = (i) => padX + (i * (w - padX * 2)) / (safePoints.length - 1)
  const sy = (v) => padY + (1 - v / max) * (h - padY * 2)
  const poly = safePoints.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="relative h-[120px] w-full">
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} className="block">
          <polyline
            points={poly}
            fill="none"
            stroke="#2BB39B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {safePoints.map((v, i) => (
          <div key={safeDays[i]} className="flex flex-col items-center gap-1">
            <span className="font-nimbli-heading text-xs font-bold text-[#1a1a1a]">{v}</span>
            <span className="text-[10px] text-[#6b7280]">{safeDays[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

