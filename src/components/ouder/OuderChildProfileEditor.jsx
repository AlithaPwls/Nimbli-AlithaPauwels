import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderAvatarPicker from '@/components/ouder/OuderAvatarPicker.jsx'

function initials(firstname, lastname) {
  const f = String(firstname ?? '').trim()
  const l = String(lastname ?? '').trim()
  const a = f ? f[0] : ''
  const b = l ? l[0] : ''
  return (a + b).toUpperCase() || 'K'
}

export default function OuderChildProfileEditor({
  child,
  avatarUrl,
  onAvatarSelected,
}) {
  if (!child) {
    return (
      <OuderSettingsCard>
        <p className="text-sm text-[#6b7280]">Selecteer een kind om te bewerken.</p>
      </OuderSettingsCard>
    )
  }

  const name = `${child?.firstname ?? ''} ${child?.lastname ?? ''}`.trim() || 'Kind'

  return (
    <OuderSettingsCard className="space-y-5">
      <div>
        <p className="font-nimbli-heading text-base font-black text-[#1a1a1a]">{name}</p>
        <p className="mt-1 text-xs text-[#6b7280]">Bewerk het kindprofiel (frontend-only).</p>
      </div>

      <OuderAvatarPicker
        valueUrl={avatarUrl || child?.avatar_url || null}
        fallbackText={initials(child?.firstname, child?.lastname)}
        onFileSelected={onAvatarSelected}
        label="Profielfoto"
      />
    </OuderSettingsCard>
  )
}

