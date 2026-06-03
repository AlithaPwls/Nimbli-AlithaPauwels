import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useActiveChildSelection } from '@/hooks/ouder/useActiveChildSelection.js'
import { useParentProfileForm } from '@/hooks/ouder/useParentProfileForm.js'
import { buildChildSearch } from '@/lib/activeChild.js'
import { Button } from '@/components/ui/button'
import NimbliDatePicker from '@/components/NimbliDatePicker.jsx'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderMobileNav from '@/components/ouder/OuderMobileNav.jsx'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderTextField from '@/components/ouder/OuderTextField.jsx'
import OuderAddressField from '@/components/ouder/OuderAddressField.jsx'

const CURRENT_YEAR = new Date().getFullYear()

const primaryButtonClass =
  'h-10 rounded bg-nimbli px-6 font-nimbli-heading text-base font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 disabled:opacity-60'

const outlineButtonClass =
  'h-10 rounded border border-nimbli bg-white px-6 font-nimbli-heading text-base font-black text-nimbli shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli-canvas disabled:opacity-60'

export default function OuderAccountEdit() {
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const [scrollContainer, setScrollContainer] = useState(null)
  const setMainRef = useCallback((node) => {
    mainRef.current = node
    setScrollContainer(node)
  }, [])

  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()
  const { activatedChildren, activeChildId, setSelectedChildId } = useActiveChildSelection(profile)
  const {
    form,
    updateField,
    reset,
    save,
    saving,
    error,
    setError,
    isDirty,
  } = useParentProfileForm()

  const instellingenPath = `/dashboard/ouder/instellingen${buildChildSearch(activeChildId)}`

  if (loading) {
    return <div className="py-8 text-center">Laden...</div>
  }

  if (!profile) {
    return <div className="py-8 text-center">Profiel niet gevonden</div>
  }

  async function handleSave() {
    const result = await save()
    if (!result.ok && result.message) {
      setError(result.message)
      return
    }
    if (result.ok) {
      navigate(instellingenPath, { state: { profileSaved: true } })
    }
  }

  return (
    <div className="flex h-svh overflow-hidden bg-nimbli-canvas">
      <OuderSidebar
        logout={logout}
        logoutLoading={logoutLoading}
        childrenList={activatedChildren}
        selectedChildId={activeChildId}
        onSelectChild={setSelectedChildId}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <OuderMobileNav
          scrollEl={scrollContainer}
          logout={logout}
          logoutLoading={logoutLoading}
          childrenList={activatedChildren}
          selectedChildId={activeChildId}
          onSelectChild={setSelectedChildId}
          headerLabel="Instellingen"
        />

        <main ref={setMainRef} className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink max-lg:px-4 max-lg:py-6">
          <div className="mt-1">
            <OuderBackLink to={instellingenPath} />
          </div>

          <div className="mt-10 max-w-[520px]">
            <h1 className="text-xl font-normal text-black">Ouderprofiel beheren</h1>

            <div className="mt-5">
              <OuderSettingsCard className="space-y-4">
                <OuderTextField
                  label="Naam"
                  placeholder="Voor- en achternaam"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
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
                  id="parent-dob"
                  label="Geboortedatum"
                  labelClassName="font-nimbli-body text-[18px] leading-[25.2px] text-black"
                  value={form.dateOfBirth}
                  onChange={(iso) => updateField('dateOfBirth', iso)}
                  fromYear={CURRENT_YEAR - 90}
                  toYear={CURRENT_YEAR}
                />
                <OuderTextField
                  label="Wachtwoord"
                  placeholder="Nieuw wachtwoord (optioneel)"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                />
              </OuderSettingsCard>

              {error ? (
                <p className="mt-4 text-sm font-medium text-[#ca0000]" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className={outlineButtonClass}
                  disabled={saving || !isDirty}
                  onClick={reset}
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
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}
