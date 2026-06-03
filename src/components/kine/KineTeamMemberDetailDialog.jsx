import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import NimbliDatePicker from '@/components/NimbliDatePicker.jsx'
import OuderAddressField from '@/components/ouder/OuderAddressField.jsx'
import OuderTextField from '@/components/ouder/OuderTextField.jsx'
import { memberToForm } from '@/lib/kine/teamMemberForm.js'

const CURRENT_YEAR = new Date().getFullYear()

const primaryButtonClass =
  'h-10 rounded bg-nimbli px-6 font-nimbli-heading text-base font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 disabled:opacity-60'

const outlineButtonClass =
  'h-10 rounded border border-nimbli bg-white px-6 font-nimbli-heading text-base font-black text-nimbli shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli-canvas disabled:opacity-60'

export default function KineTeamMemberDetailDialog({
  member,
  onOpenChange,
  onSave,
  onRequestDelete,
  saving,
  saveError,
  savedMessage,
}) {
  const [form, setForm] = useState(() => memberToForm(member))
  const [baseline, setBaseline] = useState(() => memberToForm(member))

  useEffect(() => {
    if (!member) return
    const next = memberToForm(member)
    setForm(next)
    setBaseline(next)
  }, [member])

  const isDirty = useMemo(() => {
    const keys = ['firstname', 'lastname', 'email', 'phone', 'address', 'dateOfBirth', 'password']
    return keys.some((key) => form[key] !== baseline[key])
  }, [form, baseline])

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleReset() {
    setForm(baseline)
  }

  async function handleSave() {
    const result = await onSave?.({
      kineId: member?.id,
      ...form,
    })
    if (result?.ok) {
      const next = { ...form, password: '' }
      setBaseline(next)
      setForm(next)
    }
  }

  const canDelete = member && !member.isCurrentUser

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,720px)] gap-4 overflow-y-auto border-[#e1dbd3] p-6 sm:max-w-lg">
        {member ? (
          <>
            <DialogHeader className="gap-2 text-left">
              <DialogTitle className="pr-8 font-nimbli-heading text-xl font-bold text-nimbli-ink">
                {member.name}
                {member.isCurrentUser ? (
                  <span className="ml-2 inline-flex rounded-full bg-nimbli/15 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-nimbli">
                    Jij
                  </span>
                ) : null}
              </DialogTitle>
              <DialogDescription className="text-sm text-nimbli-muted">
                {member.isCurrentUser
                  ? 'Pas je gegevens aan. Je kunt je eigen account niet verwijderen via dit scherm.'
                  : 'Bekijk en pas de gegevens van deze kinesist aan.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-lg border border-[#e1dbd3] bg-nimbli-canvas/20 p-4">
              <OuderTextField
                label="Voornaam"
                placeholder="Voornaam"
                autoComplete="given-name"
                value={form.firstname}
                onChange={(e) => updateField('firstname', e.target.value)}
              />
              <OuderTextField
                label="Achternaam"
                placeholder="Achternaam"
                autoComplete="family-name"
                value={form.lastname}
                onChange={(e) => updateField('lastname', e.target.value)}
              />
              <OuderTextField
                label="E-mailadres"
                placeholder="E-mailadres"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <OuderTextField
                label="Telefoonnummer"
                placeholder="Telefoonnummer"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
              <OuderAddressField
                label="Adres"
                placeholder="Adres"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
              <NimbliDatePicker
                id={`kine-member-dob-${member.id}`}
                label="Geboortedatum"
                labelClassName="font-nimbli-body text-[18px] leading-[25.2px] text-black"
                value={form.dateOfBirth}
                onChange={(iso) => updateField('dateOfBirth', iso)}
                fromYear={CURRENT_YEAR - 90}
                toYear={CURRENT_YEAR}
              />
              <OuderTextField
                label="Nieuw wachtwoord"
                placeholder="Laat leeg om niet te wijzigen"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
              />
            </div>

            {saveError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {saveError}
              </p>
            ) : null}
            {savedMessage ? (
              <p className="text-sm font-medium text-nimbli" role="status">
                {savedMessage}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className={outlineButtonClass}
                disabled={saving || !isDirty}
                onClick={handleReset}
              >
                Annuleren
              </Button>
              <Button
                type="button"
                className={primaryButtonClass}
                disabled={saving || !isDirty}
                onClick={() => void handleSave()}
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </Button>
            </div>

            {canDelete ? (
              <div className="border-t border-[#e1dbd3] pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={saving}
                  onClick={() => onRequestDelete?.(member)}
                  className="w-full font-nimbli-heading font-bold"
                >
                  <Trash2 className="mr-2 size-4" aria-hidden />
                  Kinesist verwijderen
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
