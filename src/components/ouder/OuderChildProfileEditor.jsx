import { UserRound } from 'lucide-react'
import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderAvatarPicker from '@/components/ouder/OuderAvatarPicker.jsx'
import {
  formatProfileBirthDate,
  profileAgeLabel,
  profileFullName,
  profileInitials,
} from '@/lib/profileDisplay.js'

function InfoRow({ label, value }) {
  return (
    <div className="rounded-[10px] bg-[#faf8f5] px-4 py-3">
      <p className="text-xs font-medium text-[#6b7280]">{label}</p>
      <p className="mt-1 font-nimbli-heading text-sm font-bold text-[#1a1a1a]">{value}</p>
    </div>
  )
}

export default function OuderChildProfileEditor({
  child,
  avatarUrl,
  avatarSaving = false,
  avatarError = null,
  onAvatarSelected,
  onAvatarRemove,
}) {
  if (!child) {
    return (
      <OuderSettingsCard className="flex min-h-[320px] flex-col items-center justify-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-nimbli/10 text-nimbli">
          <UserRound className="size-7" aria-hidden />
        </div>
        <p className="mt-4 font-nimbli-heading text-base font-bold text-[#1a1a1a]">
          Selecteer een kind
        </p>
        <p className="mt-2 max-w-xs text-sm text-[#6b7280]">
          Kies links een kindprofiel om de profielfoto te bekijken of aan te passen.
        </p>
      </OuderSettingsCard>
    )
  }

  const name = profileFullName(child?.firstname, child?.lastname)
  const age = profileAgeLabel(child?.date_of_birth)
  const birthLabel = formatProfileBirthDate(child?.date_of_birth)
  const displayAvatar = avatarUrl ?? null
  const canRemove = Boolean(displayAvatar)

  return (
    <OuderSettingsCard className="overflow-hidden p-0">
      <div className="border-b border-[#e1dbd3] bg-white px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-nimbli">
          Profiel bewerken
        </p>
        <h2 className="mt-2 text-center font-nimbli-heading text-2xl font-extrabold tracking-tight text-[#1a1a1a]">
          {name}
        </h2>
        {age || birthLabel ? (
          <p className="mt-1 text-center text-sm text-[#6b7280]">
            {[age, birthLabel].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="px-6 py-8 sm:px-8">
        <OuderAvatarPicker
          valueUrl={displayAvatar}
          fallbackText={profileInitials(child?.firstname, child?.lastname)}
          name={name}
          onFileSelected={onAvatarSelected}
          onRemove={onAvatarRemove}
          canRemove={canRemove}
          saving={avatarSaving}
          size="lg"
        />

        {avatarError ? (
          <p className="mt-6 text-center text-sm font-medium text-red-600" role="alert">
            {avatarError}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <InfoRow label="Voornaam" value={child?.firstname?.trim() || '—'} />
          <InfoRow label="Achternaam" value={child?.lastname?.trim() || '—'} />
          {birthLabel ? <InfoRow label="Geboortedatum" value={birthLabel} /> : null}
        </div>
      </div>
    </OuderSettingsCard>
  )
}
