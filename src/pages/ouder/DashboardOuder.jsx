import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useChildrenForParent } from '@/hooks/ouder/useChildrenForParent.js'
import { useParentDashboardData } from '@/hooks/ouder/useParentDashboardData.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderStatPill from '@/components/ouder/OuderStatPill.jsx'
import OuderMiniLineChart from '@/components/ouder/OuderMiniLineChart.jsx'
import OuderProgressRow from '@/components/ouder/OuderProgressRow.jsx'
import OuderUpcomingExercise from '@/components/ouder/OuderUpcomingExercise.jsx'
import OuderRecentSection from '@/components/ouder/OuderRecentSection.jsx'
import { FALLBACK_PROFILE_PIC, resolveProfileAvatarUrl } from '@/lib/profileAvatar.js'

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const d = new Date(dateOfBirth)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age >= 0 ? age : null
}

function formatMemberSince(dateValue) {
  if (!dateValue) return null
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return null
  const month = d.toLocaleString('nl-BE', { month: 'long' })
  return `Lid sinds ${month} ${d.getFullYear()}`
}

export default function DashboardOuder() {
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()
  const { children, loading: childrenLoading, error: childrenError } = useChildrenForParent(profile)

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
      const id = children[0].id
      setSelectedChildId(id)
      const next = new URLSearchParams(searchParams)
      next.set('child', id)
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, selectedChildId])

  const selectedChild = useMemo(() => {
    return (children ?? []).find((c) => c?.id === selectedChildId) ?? null
  }, [children, selectedChildId])

  const dashboard = useParentDashboardData(selectedChildId)

  const parentWelcomeTitle = useMemo(() => {
    const first = profile?.firstname?.trim() ?? ''
    const last = profile?.lastname?.trim() ?? ''
    const full = `${first} ${last}`.trim()
    return full ? `Welkom, ${full} !` : 'Welkom'
  }, [profile])

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  if (!profile) {
    return <div className="text-center py-8">Profiel niet gevonden</div>
  }

  const childTitle =
    (dashboard.header?.fullName && dashboard.header.fullName !== '—'
      ? dashboard.header.fullName
      : `${selectedChild?.firstname ?? ''} ${selectedChild?.lastname ?? ''}`.trim()) || '—'

  const ageValue = dashboard.header?.age ?? calcAge(selectedChild?.date_of_birth)
  const childAge = ageValue != null ? `${ageValue} jaar` : null
  const childLine = [childTitle, childAge].filter(Boolean).join(' - ')
  const memberSince =
    dashboard.header?.memberSince ??
    formatMemberSince(selectedChild?.created_at) ??
    (childrenLoading ? 'Laden…' : '—')

  const focusValue = dashboard.header?.goal ?? (selectedChild?.treatment_goal?.trim() || null)
  const goal = focusValue ? `Doel : ${focusValue}` : 'Doel : —'
  const avatarSrcRaw = dashboard.header?.avatarUrl ?? selectedChild?.avatar_url ?? ''
  const [avatarSrc, setAvatarSrc] = useState(() => resolveProfileAvatarUrl(avatarSrcRaw))

  useEffect(() => {
    setAvatarSrc(resolveProfileAvatarUrl(avatarSrcRaw))
  }, [avatarSrcRaw])

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
          <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            {parentWelcomeTitle}
          </h1>

          {childrenError ? (
            <div
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800"
              role="alert"
            >
              <p className="text-sm font-semibold">Kindprofielen laden mislukt</p>
              <p className="mt-1 text-xs opacity-90">
                {childrenError.message || String(childrenError)}
              </p>
            </div>
          ) : null}

          {dashboard.error ? (
            <div
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800"
              role="alert"
            >
              <p className="text-sm font-semibold">Dashboard laden mislukt</p>
              <p className="mt-1 text-xs opacity-90">
                {dashboard.error.message || String(dashboard.error)}
              </p>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3]">
            <div className="flex items-start gap-6">
              <div className="h-[125px] w-[125px] shrink-0 overflow-hidden rounded-lg border border-[#e1dbd3] shadow-[0_2px_0_0_#e1dbd3]">
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarSrc(FALLBACK_PROFILE_PIC)}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-nimbli-heading text-2xl font-bold text-[#1a1a1a]">{childLine}</p>
                <p className="mt-2 text-base text-[#1a1a1a]">{memberSince}</p>
                <p className="mt-10 text-base text-[#1a1a1a]">{goal}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
            <section className="flex min-h-0 w-full min-w-0 flex-col rounded-[14px] border-2 border-[#e1dbd3] bg-white px-[21px] pt-[21px] pb-[22px] shadow-[0_2px_0_0_#e1dbd3]">
              <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <p className="font-nimbli-heading text-base font-bold text-[#1a1a1a]">Frequentie per week</p>
                {dashboard.weekly?.monthLabel ? (
                  <span className="text-center text-sm font-medium text-[#6b7280]">
                    {dashboard.weekly.monthLabel}
                  </span>
                ) : (
                  <span aria-hidden />
                )}
                <div className="flex justify-end">
                  <OuderStatPill value={`${dashboard.weekly?.deltaPercent ?? 0}%`} />
                </div>
              </header>
              <div className="mt-4 flex min-h-0 flex-1 flex-col">
                <OuderMiniLineChart
                  points={dashboard.weekly?.points}
                  days={dashboard.weekly?.days}
                  dayDates={dashboard.weekly?.dayDates}
                />
              </div>
            </section>

            <section className="flex w-full min-w-0 flex-col rounded-[14px] border-2 border-[#e1dbd3] bg-white px-[21px] pt-[21px] pb-[22px] shadow-[0_2px_0_0_#e1dbd3]">
              <header className="flex items-center justify-between">
                <p className="font-nimbli-heading text-base font-bold text-[#1a1a1a]">Aankomende oefeningen</p>
              </header>
              <div className="mt-4 flex flex-col gap-3">
                {dashboard.loading ? (
                  <div className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm text-[#6b7280]">
                    Oefeningen laden…
                  </div>
                ) : (dashboard.upcoming ?? []).length === 0 ? (
                  <div className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 text-sm text-[#6b7280]">
                    Geen aankomende oefeningen gevonden.
                  </div>
                ) : (
                  (dashboard.upcoming ?? []).map((u) => (
                    <OuderUpcomingExercise
                      key={u.id}
                      title={u.title}
                      focus={u.focus}
                      categoryTone={u.categoryTone}
                      reps={u.reps}
                      minutes={u.minutes}
                      imageUrl={u.imageUrl}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="w-full min-w-0 rounded-[14px] border-2 border-[#e1dbd3] bg-white px-[21px] pt-[21px] pb-[22px] shadow-[0_2px_0_0_#e1dbd3]">
              <header className="flex items-center justify-between">
                <p className="font-nimbli-heading text-base font-bold text-[#1a1a1a]">Voortgangsindicatoren</p>
              </header>
              <div className="mt-5 flex flex-col gap-5">
                <OuderProgressRow label="Balans" value={dashboard.progress?.balans ?? 0} />
                <OuderProgressRow label="Mobiliteit" value={dashboard.progress?.mobiliteit ?? 0} />
                <OuderProgressRow label="Kracht" value={dashboard.progress?.kracht ?? 0} />
              </div>
            </section>

            <OuderRecentSection
              items={dashboard.recent ?? []}
              loading={dashboard.loading}
              className="rounded-[14px]"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
