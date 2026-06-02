import { Mail, Phone, QrCode, User } from 'lucide-react'
import { FALLBACK_PROFILE_PIC, resolveProfileAvatarUrl } from '@/lib/profileAvatar.js'

function dash(value) {
  return value?.trim() ? value.trim() : '—'
}

export default function KinePatientHeaderCard({ patient, parent, onQrClick, qrDisabled = false }) {
  const birthdateLine = patient?.birthdateLabel
    ? `Geboortedatum: ${patient.birthdateLabel}`
    : 'Geboortedatum: —'
  const treatmentGoal = dash(patient?.treatmentGoal)
  const parentName = dash(parent?.name)
  const parentRelation = dash(parent?.relation)
  const parentEmail = dash(parent?.email)
  const parentPhone = dash(parent?.phone)

  return (
    <section className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 pb-8 pt-8 shadow-[0_2px_0_0_#e1dbd3]">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-5">
          <img
            src={resolveProfileAvatarUrl(patient?.avatarUrl)}
            alt={patient?.name ? `Profielfoto van ${patient.name}` : ''}
            className="size-24 shrink-0 rounded-md object-cover ring-1 ring-nimbli-slot-border/20"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_PROFILE_PIC
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-nimbli-heading text-2xl font-extrabold text-[#1a1a1a]">
                {patient?.name ?? '—'}
              </h1>
              {patient?.ageLabel ? (
                <span className="inline-flex h-6 items-center rounded-full bg-[#e8f7f4] px-3 text-xs font-bold text-nimbli">
                  {patient.ageLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs font-semibold text-[#6b7280]">{birthdateLine}</p>
            <div className="mt-4 max-w-lg rounded-[14px] bg-[#f9fafb] px-4 py-4">
              <p className="text-xs font-bold uppercase text-[#6b7280]">Behandeldoel</p>
              <p className="mt-2 font-nimbli-heading text-sm font-extrabold text-[#1a1a1a]">
                {treatmentGoal}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onQrClick}
          disabled={qrDisabled}
          aria-label="Activatiecode tonen"
          className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-nimbli text-white transition-colors hover:bg-nimbli/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <QrCode className="size-6" aria-hidden />
        </button>
      </div>

      <div className="mt-6 border-t border-[#e5e7eb] pt-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[14px] bg-[#e8f7f4] text-nimbli">
              <User className="size-5" aria-hidden />
            </div>
            <div>
              <p className="font-nimbli-heading text-sm font-extrabold text-[#1a1a1a]">{parentName}</p>
              <p className="text-xs font-semibold text-[#6b7280]">{parentRelation}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6b7280]">
              <Mail className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{parentEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6b7280]">
              <Phone className="size-4 shrink-0" aria-hidden />
              <span>{parentPhone}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
