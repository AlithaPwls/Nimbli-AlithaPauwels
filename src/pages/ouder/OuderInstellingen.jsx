import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useNavigate } from 'react-router-dom'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderSettingsToggleRow from '@/components/ouder/OuderSettingsToggleRow.jsx'
import OuderSettingsActionRow from '@/components/ouder/OuderSettingsActionRow.jsx'

export default function OuderInstellingen() {
  const navigate = useNavigate()
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()

  const [cameraAccess, setCameraAccess] = useState(true)
  const [shareData, setShareData] = useState(false)
  const [progressUpdates, setProgressUpdates] = useState(true)
  const [missedExercise, setMissedExercise] = useState(true)
  const [dailyReminder, setDailyReminder] = useState(false)

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
          <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-black">
            Instellingen
          </h1>

          <div className="mt-10 flex max-w-[540px] flex-col gap-10">
            <section>
              <h2 className="text-xl font-normal text-black">Begeleiding</h2>
              <div className="mt-5">
                <OuderSettingsCard>
                  <div className="rounded-[10px] bg-[#f9fafb] px-3 py-4">
                    <p className="text-xs text-[#6b7280]">Gekoppelde kinesist</p>
                    <p className="mt-1 text-sm font-bold text-[#1a1a1a]">
                      Dr. Evelyne Janssens
                    </p>
                  </div>
                </OuderSettingsCard>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-normal text-black">Privacy en data</h2>
              <div className="mt-5">
                <OuderSettingsCard className="space-y-6">
                  <OuderSettingsToggleRow
                    title="Camera toegang (pose detection)"
                    description="Nodig voor bewegingsanalyse tijdens oefeningen"
                    value={cameraAccess}
                    onChange={setCameraAccess}
                  />
                  <OuderSettingsToggleRow
                    title="Data delen voor verbetering"
                    description="Help ons de app te verbeteren (anoniem)"
                    value={shareData}
                    onChange={setShareData}
                  />
                </OuderSettingsCard>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-normal text-black">Meldingen</h2>
              <div className="mt-5">
                <OuderSettingsCard className="space-y-6">
                  <OuderSettingsToggleRow
                    title="Voortgangsupdates ontvangen"
                    description="Ontvang een melding wanneer er nieuwe updates zijn"
                    value={progressUpdates}
                    onChange={setProgressUpdates}
                  />
                  <OuderSettingsToggleRow
                    title="Melding bij gemiste oefening(en)"
                    description="Ontvang een melding als je kind een oefening mist"
                    value={missedExercise}
                    onChange={setMissedExercise}
                  />
                  <OuderSettingsToggleRow
                    title="Herinnering oefenen"
                    description="Ontvang dagelijks een herinnering om te oefenen"
                    value={dailyReminder}
                    onChange={setDailyReminder}
                  />
                </OuderSettingsCard>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-normal text-black">Profielen beheren</h2>
              <div className="mt-5">
                <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-[21px] pt-[21px] pb-[22px]">
                  <div className="flex flex-col gap-3">
                    <OuderSettingsActionRow
                      label="Kindprofiel(en) beheren"
                      icon="edit"
                      onClick={() => navigate('/dashboard/ouder/kindprofielen')}
                    />
                    <OuderSettingsActionRow
                      label="Ouderprofiel bewerken"
                      icon="edit"
                      onClick={() => navigate('/dashboard/ouder/account-bewerken')}
                    />
                    <OuderSettingsActionRow
                      label="Profiel archiveren"
                      tone="danger"
                      icon="trash"
                      onClick={() => {}}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

