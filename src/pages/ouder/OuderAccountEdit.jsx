import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderTextField from '@/components/ouder/OuderTextField.jsx'

export default function OuderAccountEdit() {
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  if (!profile) {
    return <div className="text-center py-8">Profiel niet gevonden</div>
  }

  return (
    <div className="flex h-svh overflow-hidden bg-nimbli-canvas">
      <OuderSidebar logout={logout} logoutLoading={logoutLoading} />

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
          <div className="mt-1">
            <OuderBackLink to="/dashboard/ouder/instellingen" />
          </div>

          <div className="mt-10 max-w-[520px]">
            <h1 className="text-xl font-normal text-black">Ouderprofiel beheren</h1>

            <div className="mt-5">
              <OuderSettingsCard className="space-y-4">
                <OuderTextField label="Naam" placeholder="Voor- en achternaam" />
                <OuderTextField label="Email adres" placeholder="Email adres" />
                <OuderTextField label="Telefoonnummer" placeholder="Telefoonnummer" />
                <OuderTextField label="Adres" placeholder="Adres" />
                <OuderTextField label="Geboortedatum" placeholder="bv. 29 juli 2001" />
              </OuderSettingsCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

