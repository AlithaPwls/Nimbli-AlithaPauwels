import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useChildrenForParent } from '@/hooks/ouder/useChildrenForParent.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import OuderChildCard from '@/components/ouder/OuderChildCard.jsx'
import OuderChildProfileEditor from '@/components/ouder/OuderChildProfileEditor.jsx'

function initials(firstname, lastname) {
  const f = String(firstname ?? '').trim()
  const l = String(lastname ?? '').trim()
  const a = f ? f[0] : ''
  const b = l ? l[0] : ''
  return (a + b).toUpperCase() || 'K'
}

export default function OuderKindProfielenBeheren() {
  const navigate = useNavigate()
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()
  const { children, loading: childrenLoading, error } = useChildrenForParent(profile)

  const [selectedChildId, setSelectedChildId] = useState(null)
  const [localAvatarById, setLocalAvatarById] = useState(() => new Map())

  useEffect(() => {
    if (!selectedChildId && Array.isArray(children) && children.length > 0) {
      setSelectedChildId(children[0].id)
    }
  }, [children, selectedChildId])

  useEffect(() => {
    return () => {
      for (const url of localAvatarById.values()) {
        if (typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      }
    }
  }, [localAvatarById])

  const selectedChild = useMemo(() => {
    return (children ?? []).find((c) => c?.id === selectedChildId) ?? null
  }, [children, selectedChildId])

  function handleSelect(child) {
    setSelectedChildId(child?.id ?? null)
  }

  function handleAvatarSelected(file) {
    if (!selectedChild?.id) return
    const id = selectedChild.id
    const nextUrl = URL.createObjectURL(file)

    setLocalAvatarById((prev) => {
      const next = new Map(prev)
      const oldUrl = next.get(id)
      if (typeof oldUrl === 'string' && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl)
      }
      next.set(id, nextUrl)
      return next
    })
  }

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
          <OuderBackLink to="/dashboard/ouder/instellingen" />

          <div className="mt-8 flex items-end justify-between gap-6">
            <div>
              <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-black">
                Kindprofiel(en) beheren
              </h1>
              <p className="mt-2 text-sm text-[#6b7280]">
                Kies een kind en pas de profielfoto aan (frontend-only).
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard/ouder/instellingen')}
              className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold text-[#302d2d] shadow-[0_2px_0_0_#e1dbd3] transition-colors hover:bg-[#f9fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
            >
              Klaar
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <section className="flex flex-col gap-3">
              {childrenLoading ? (
                <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-6 text-sm text-[#6b7280]">
                  Kindprofielen laden…
                </div>
              ) : error ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800"
                  role="alert"
                >
                  {error.message || String(error)}
                </div>
              ) : (children ?? []).length === 0 ? (
                <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-6 text-sm text-[#6b7280]">
                  Geen kindprofielen gevonden.
                </div>
              ) : (
                (children ?? []).map((c) => (
                  <OuderChildCard
                    key={c.id}
                    child={c}
                    selected={c.id === selectedChildId}
                    onSelect={handleSelect}
                    avatarOverrideUrl={localAvatarById.get(c.id) || null}
                  />
                ))
              )}
            </section>

            <section>
              <OuderChildProfileEditor
                child={selectedChild}
                avatarUrl={selectedChild?.id ? localAvatarById.get(selectedChild.id) : null}
                onAvatarSelected={handleAvatarSelected}
                fallbackText={initials(selectedChild?.firstname, selectedChild?.lastname)}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

