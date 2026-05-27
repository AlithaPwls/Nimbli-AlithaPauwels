import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderTextField from '@/components/ouder/OuderTextField.jsx'
import { useInviteKineTeamMember } from '@/hooks/kine/useInviteKineTeamMember.js'

const primaryButtonClass =
  'h-10 rounded bg-nimbli px-6 font-nimbli-heading text-base font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 disabled:opacity-60'

const outlineButtonClass =
  'h-10 rounded border border-nimbli bg-white px-6 font-nimbli-heading text-base font-black text-nimbli shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli-canvas disabled:opacity-60'

const emptyForm = {
  firstname: '',
  lastname: '',
  dateOfBirth: '',
  email: '',
  password: '',
  repeatPassword: '',
}

export default function KineNieuweGebruiker() {
  const navigate = useNavigate()
  const { invite, loading, error, setError } = useInviteKineTeamMember()
  const [form, setForm] = useState(emptyForm)
  const [successMessage, setSuccessMessage] = useState(null)

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setError(null)
    setSuccessMessage(null)
  }

  function handleCancel() {
    navigate('/dashboard/kine/instellingen')
  }

  async function handleSave() {
    const result = await invite(form)
    if (result.ok) {
      setSuccessMessage('De nieuwe gebruiker is toegevoegd.')
      setForm(emptyForm)
      setTimeout(() => {
        navigate('/dashboard/kine/instellingen')
      }, 1200)
    }
  }

  const isDirty =
    form.firstname.trim() !== '' ||
    form.lastname.trim() !== '' ||
    form.dateOfBirth !== '' ||
    form.email.trim() !== '' ||
    form.password !== '' ||
    form.repeatPassword !== ''

  return (
    <div className="min-h-svh bg-nimbli-foreground">
      <div className="mx-auto max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
        <OuderBackLink to="/dashboard/kine/instellingen" />

        <h1 className="mt-6 font-nimbli-heading text-4xl font-extrabold tracking-tight text-black">
          Nieuwe gebruiker toevoegen
        </h1>

        <section className="mt-10 w-full max-w-[520px]">
          <h2 className="text-xl font-normal text-black">Maak een nieuwe gebruiker aan</h2>

          <div className="mt-5">
            <OuderSettingsCard className="space-y-3">
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
                label="Geboortedatum"
                placeholder="Geboortedatum"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
              />
              <OuderTextField
                label="Email adres"
                placeholder="Email adres"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <OuderTextField
                label="Wachtwoord"
                placeholder="Wachtwoord"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
              />
              <OuderTextField
                label="Herhaal wachtwoord"
                placeholder="Herhaal wachtwoord"
                type="password"
                autoComplete="new-password"
                value={form.repeatPassword}
                onChange={(e) => updateField('repeatPassword', e.target.value)}
              />
            </OuderSettingsCard>

            {error ? (
              <p className="mt-4 text-sm font-medium text-[#ca0000]" role="alert">
                {error}
              </p>
            ) : null}
            {successMessage ? (
              <p className="mt-4 text-sm font-medium text-nimbli" role="status">
                {successMessage}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className={outlineButtonClass}
                disabled={loading}
                onClick={handleCancel}
              >
                Annuleren
              </Button>
              <Button
                type="button"
                className={primaryButtonClass}
                disabled={loading || !isDirty}
                onClick={() => void handleSave()}
              >
                {loading ? 'Opslaan…' : 'Opslaan'}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
