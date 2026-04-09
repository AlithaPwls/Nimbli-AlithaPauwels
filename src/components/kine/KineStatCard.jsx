function clampProgress(progress) {
  const safe = Number.isFinite(progress) ? progress : 0
  return Math.min(1, Math.max(0, safe))
}

function progressValue(progress) {
  return Math.round(clampProgress(progress) * 100)
}

export default function KineStatCard({ title, value, subtitle, accent = 'nimbli', progress = null, Icon }) {
  const barValue = progress == null ? null : progressValue(progress)

  const iconWrap =
    accent === 'nimbli'
      ? 'bg-nimbli text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]'
      : accent === 'yellow'
        ? 'bg-[#fff8eb] text-[#FBB92A]'
        : 'bg-[#ebf4fb] text-[#82B3E1]'

  const valueClass =
    accent === 'nimbli' ? 'text-nimbli' : accent === 'yellow' ? 'text-[#FBB92A]' : 'text-[#82B3E1]'

  const barFillClass =
    accent === 'yellow'
      ? 'bg-gradient-to-r from-[#FBB92A] to-[#FFD080]'
      : accent === 'blue'
        ? 'bg-[#82B3E1]'
        : 'bg-nimbli'

  return (
    <div className="relative overflow-hidden rounded-[14px] border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3]">
      {accent === 'nimbli' ? (
        <div
          className="pointer-events-none absolute -right-2 -top-8 size-24 rounded-full bg-nimbli/10 blur-2xl"
          aria-hidden
        />
      ) : null}
      <div className="relative flex items-start gap-2.5">
        <div className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${iconWrap}`}>
          {Icon ? <Icon className="size-5" strokeWidth={2} aria-hidden /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-nimbli-heading text-lg font-bold leading-tight text-[#6b7280]">{title}</p>
          <p className={`mt-3 font-nimbli-heading text-[32px] font-extrabold leading-none ${valueClass}`}>
            {value}
          </p>
          {subtitle ? (
            <p
              className={[
                'mt-1 font-nimbli-body text-xs',
                accent === 'nimbli' ? 'text-[#9ca3af]' : 'text-[#6b7280]',
              ].join(' ')}
            >
              {subtitle}
            </p>
          ) : null}

          {barValue != null ? (
            <div className="mt-2 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${barFillClass}`}
                  style={{ width: `${barValue}%` }}
                />
              </div>
            </div>
          ) : accent !== 'nimbli' ? (
            <div className="mt-2 h-2 w-full rounded-full bg-[#f3f4f6]" aria-hidden />
          ) : null}
        </div>
      </div>
    </div>
  )
}
