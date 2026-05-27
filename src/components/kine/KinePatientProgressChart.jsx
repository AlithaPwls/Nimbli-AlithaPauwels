import { useId } from 'react'

const Y_LABELS = [100, 75, 50, 25, 0]
const W = 520
const H = 200
/** Matches Tailwind w-11 / pl-11 (44px) beside the chart. */
const PAD_LEFT = 44
const PAD_RIGHT = 18
const PAD_TOP = 16
const PAD_BOTTOM = 28
const DAY_COUNT = 7

function toInt(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

const FALLBACK_POINTS = [0, 0, 0, 0, 0, 0, 0]
const FALLBACK_DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export default function KinePatientProgressChart({ points = FALLBACK_POINTS, days = FALLBACK_DAYS }) {
  const gradientId = useId()
  const safePoints =
    Array.isArray(points) && points.length === DAY_COUNT ? points.map(toInt) : FALLBACK_POINTS
  const safeDays = Array.isArray(days) && days.length === DAY_COUNT ? days : FALLBACK_DAYS

  const chartW = W - PAD_LEFT - PAD_RIGHT
  const chartH = H - PAD_TOP - PAD_BOTTOM

  /** Center of each day column (aligns with grid-cols-7 below). */
  const sx = (i) => PAD_LEFT + ((i + 0.5) / DAY_COUNT) * chartW
  const sy = (v) => PAD_TOP + (1 - v / 100) * chartH
  const poly = safePoints.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')
  const areaPoly = `${PAD_LEFT},${PAD_TOP + chartH} ${poly} ${PAD_LEFT + chartW},${PAD_TOP + chartH}`

  return (
    <div className="flex w-full gap-3">
      <div className="flex h-[200px] w-11 shrink-0 flex-col justify-between py-1 text-[13px] text-[#9ca3af]">
        {Y_LABELS.map((label) => (
          <span key={label}>{label}%</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-[200px] w-full">
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} className="block" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2BB39B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2BB39B" stopOpacity="0" />
              </linearGradient>
            </defs>
            {Y_LABELS.map((label) => {
              const y = sy(label)
              return (
                <line
                  key={label}
                  x1={PAD_LEFT}
                  y1={y}
                  x2={W - PAD_RIGHT}
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
              stroke="#2BB39B"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {safePoints.map((v, i) => (
              <circle key={safeDays[i]} cx={sx(i)} cy={sy(v)} r="5" fill="#2BB39B" />
            ))}
          </svg>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 pl-11">
          {safeDays.map((day) => (
            <span key={day} className="text-center text-[13px] text-[#6b7280]">
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
