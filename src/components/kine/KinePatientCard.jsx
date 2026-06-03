import { FALLBACK_PROFILE_PIC, resolveProfileAvatarUrl } from '@/lib/profileAvatar.js'

function clampProgress(progress) {
  const safe = Number.isFinite(progress) ? progress : 0
  return Math.min(1, Math.max(0, safe))
}

function progressValue(progress) {
  return Math.round(clampProgress(progress) * 100)
}

function formatPct(progress) {
  return `${Math.round(clampProgress(progress) * 100)}%`
}

export default function KinePatientCard({ patient, onSelect }) {
  const pct = formatPct(patient.progress)
  const barValue = progressValue(patient.progress)

  return (
    <button
      type="button"
      onClick={() => onSelect?.(patient)}
      aria-label={`Bekijk details van ${patient.name}`}
      className="group relative w-full cursor-pointer rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 text-left shadow-[0_2px_0_0_#e1dbd3] transition-colors hover:border-nimbli/50 hover:bg-nimbli-canvas/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 active:border-nimbli/50 active:bg-nimbli-canvas/60 max-lg:p-4"
    >
      <div className="flex items-start gap-4 max-lg:gap-3">
        <img
          className="mt-0.5 size-12 shrink-0 rounded-2xl object-cover ring-1 ring-nimbli-slot-border/20 max-lg:size-10 max-lg:rounded-xl"
          src={resolveProfileAvatarUrl(patient.avatarUrl)}
          alt={`${patient.name} profielfoto`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_PROFILE_PIC
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-nimbli-heading text-base font-extrabold text-nimbli-ink">{patient.name}</p>
              <p className="mt-0.5 text-xs text-nimbli-muted">{patient.age} jaar</p>
            </div>
            <p className="shrink-0 text-xs font-semibold text-nimbli">{patient.delta}</p>
          </div>

          <p className="mt-3 line-clamp-2 text-xs text-nimbli-muted">{patient.focus}</p>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-nimbli-muted">
            <span className="size-2 rounded-full bg-nimbli" aria-hidden />
            <span className="truncate">Laatste sessie: {patient.lastSession}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <progress
              className="h-2 flex-1 overflow-hidden rounded-full bg-nimbli-canvas accent-[#82B3E1]"
              value={barValue}
              max={100}
              aria-label={`Weekvoortgang ${patient.name}: ${barValue}% van toegewezen oefeningen`}
            />
            <p className="w-10 text-right text-[11px] font-semibold text-nimbli-muted">{pct}</p>
          </div>
        </div>
      </div>
    </button>
  )
}
