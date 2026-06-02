import { useCallback, useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useChildrenForParent } from '@/hooks/ouder/useChildrenForParent.js'
import { removeChildAvatar, uploadChildAvatar } from '@/lib/ouder/childAvatarStorage.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderChildCard from '@/components/ouder/OuderChildCard.jsx'
import OuderChildProfileEditor from '@/components/ouder/OuderChildProfileEditor.jsx'
import { useSearchParams } from 'react-router-dom'

function revokeBlobUrl(url) {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function getChildAvatarUrl(child, previewById) {
  if (!child?.id) return null
  return previewById.get(child.id) ?? child.avatar_url ?? null
}

export default function OuderKindProfielenBeheren() {
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()
  const { children, loading: childrenLoading, error, patchChild } = useChildrenForParent(profile)

  const [searchParams, setSearchParams] = useSearchParams()
  const childParam = searchParams.get('child')
  const [selectedChildId, setSelectedChildId] = useState(childParam)
  const [previewById, setPreviewById] = useState(() => new Map())
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState(null)

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

  useEffect(() => {
    return () => {
      for (const url of previewById.values()) {
        revokeBlobUrl(url)
      }
    }
  }, [previewById])

  const selectedChild = useMemo(() => {
    return (children ?? []).find((c) => c?.id === selectedChildId) ?? null
  }, [children, selectedChildId])

  const selectedAvatarUrl = useMemo(() => {
    if (!selectedChild) return null
    return getChildAvatarUrl(selectedChild, previewById)
  }, [selectedChild, previewById])

  const handleSelect = useCallback((child) => {
    setSelectedChildId(child?.id ?? null)
    setAvatarError(null)
  }, [])

  const clearPreview = useCallback((childId) => {
    setPreviewById((prev) => {
      const next = new Map(prev)
      revokeBlobUrl(next.get(childId))
      next.delete(childId)
      return next
    })
  }, [])

  const handleAvatarSelected = useCallback(
    async (file) => {
      if (!selectedChild?.id) return
      const childId = selectedChild.id
      setAvatarError(null)

      const previewUrl = URL.createObjectURL(file)
      setPreviewById((prev) => {
        const next = new Map(prev)
        revokeBlobUrl(next.get(childId))
        next.set(childId, previewUrl)
        return next
      })

      setAvatarSaving(true)
      const res = await uploadChildAvatar(childId, file)
      setAvatarSaving(false)

      if (!res.ok) {
        setAvatarError(res.message ?? 'Profielfoto opslaan mislukt.')
        clearPreview(childId)
        return
      }

      patchChild(childId, { avatar_url: res.avatarUrl })
      clearPreview(childId)
    },
    [selectedChild?.id, patchChild, clearPreview]
  )

  const handleAvatarRemove = useCallback(async () => {
    if (!selectedChild?.id) return
    const childId = selectedChild.id
    setAvatarError(null)
    setAvatarSaving(true)

    const res = await removeChildAvatar(childId)
    setAvatarSaving(false)

    if (!res.ok) {
      setAvatarError(res.message ?? 'Profielfoto verwijderen mislukt.')
      return
    }

    patchChild(childId, { avatar_url: null })
    clearPreview(childId)
  }, [selectedChild?.id, patchChild, clearPreview])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-nimbli-canvas font-nimbli-body text-nimbli-muted">
        Laden…
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-nimbli-canvas font-nimbli-body text-nimbli-muted">
        Profiel niet gevonden
      </div>
    )
  }

  const childList = children ?? []
  const hasMultiple = childList.length > 1

  return (
    <div className="flex h-svh overflow-hidden bg-nimbli-canvas">
      <OuderSidebar
        logout={logout}
        logoutLoading={logoutLoading}
        childrenList={children}
        selectedChildId={selectedChildId}
        onSelectChild={(id) => {
          setSelectedChildId(id)
          setAvatarError(null)
          const next = new URLSearchParams(searchParams)
          if (id) next.set('child', id)
          else next.delete('child')
          setSearchParams(next, { replace: true })
        }}
      />

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 font-nimbli-body text-nimbli-ink sm:px-8 sm:py-10">
          <OuderBackLink to="/dashboard/ouder/instellingen" />

          <header className="mt-6 sm:mt-8">
            <h1 className="font-nimbli-heading text-3xl font-extrabold tracking-tight text-[#1a1a1a] sm:text-4xl">
              Kindprofielen
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
              Pas de profielfoto van je kind aan. Wijzigingen worden direct opgeslagen.
            </p>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-8">
            <aside className="min-w-0">
              <OuderSettingsCard className="!px-4 !py-4 sm:!px-5">
                <div className="flex items-center gap-2">
                  <Users className="size-4 shrink-0 text-nimbli" aria-hidden />
                  <h2 className="font-nimbli-heading text-sm font-black text-[#1a1a1a]">
                    {hasMultiple ? 'Jouw kinderen' : 'Jouw kind'}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-[#6b7280]">
                  {hasMultiple
                    ? 'Kies wie je wilt bewerken.'
                    : 'Dit profiel hoort bij je gezinscode.'}
                </p>

                <div
                  className={[
                    'mt-4 flex flex-col gap-2.5',
                    hasMultiple
                      ? 'max-lg:flex-row max-lg:overflow-x-auto max-lg:pb-1 max-lg:[scrollbar-width:thin]'
                      : '',
                  ].join(' ')}
                >
                  {childrenLoading ? (
                    <p className="py-4 text-sm text-[#6b7280]">Kindprofielen laden…</p>
                  ) : error ? (
                    <div
                      className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                      role="alert"
                    >
                      {error.message || String(error)}
                    </div>
                  ) : childList.length === 0 ? (
                    <p className="py-4 text-sm text-[#6b7280]">Geen kindprofielen gevonden.</p>
                  ) : (
                    childList.map((c) => (
                      <div
                        key={c.id}
                        className={hasMultiple ? 'max-lg:min-w-[240px] max-lg:shrink-0' : undefined}
                      >
                        <OuderChildCard
                          child={c}
                          selected={c.id === selectedChildId}
                          onSelect={handleSelect}
                          avatarUrl={getChildAvatarUrl(c, previewById)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </OuderSettingsCard>
            </aside>

            <section className="min-w-0">
              <OuderChildProfileEditor
                child={selectedChild}
                avatarUrl={selectedAvatarUrl}
                avatarSaving={avatarSaving}
                avatarError={avatarError}
                onAvatarSelected={handleAvatarSelected}
                onAvatarRemove={handleAvatarRemove}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
