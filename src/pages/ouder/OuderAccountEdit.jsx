import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useChildrenForParent } from '@/hooks/ouder/useChildrenForParent.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderTextField from '@/components/ouder/OuderTextField.jsx'

export default function OuderAccountEdit() {
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()
  const { children } = useChildrenForParent(profile)

  const [searchParams, setSearchParams] = useSearchParams()
  const childParam = searchParams.get('child')
  const [selectedChildId, setSelectedChildId] = useState(childParam)

  useEffect(() => {
    if (childParam !== selectedChildId) {
      setSelectedChildId(childParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childParam])

  useEffect(() => {
    if (!selectedChildId && Array.isArray(children) && children.length > 0) {
      const id = children[0]?.id ?? null
      if (!id) return
      setSelectedChildId(id)
      const next = new URLSearchParams(searchParams)
      next.set('child', id)
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, selectedChildId])

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  if (!profile) {
    return <div className="text-center py-8">Profiel niet gevonden</div>
  }

  return (
    <div className="flex h-svh overflow-hidden bg-nimbli-canvas">
      <OuderSidebar
        logout={logout}
        logoutLoading={logoutLoading}
        childrenList={children}
        selectedChildId={selectedChildId}
        onSelectChild={(id) => {
          setSelectedChildId(id)
          const next = new URLSearchParams(searchParams)
          if (id) next.set('child', id)
          else next.delete('child')
          setSearchParams(next, { replace: true })
        }}
      />

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

