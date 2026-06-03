import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useActiveChildSelection } from '@/hooks/ouder/useActiveChildSelection.js'
import { useParentDashboardData } from '@/hooks/ouder/useParentDashboardData.js'
import { buildChildSearch } from '@/lib/activeChild.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderMobileNav from '@/components/ouder/OuderMobileNav.jsx'
import OuderChildSwitcher from '@/components/ouder/OuderChildSwitcher.jsx'
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
  const mainRef = useRef(null)
  const [scrollContainer, setScrollContainer] = useState(null)
  const setMainRef = useCallback((node) => {
    mainRef.current = node
    setScrollContainer(node)
  }, [])

  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()
  const {
    activatedChildren,
    pendingChildren,
    loading: childrenLoading,
    error: childrenError,
    activeChildId,
    selectedChild,
    setSelectedChildId,
  } = useActiveChildSelection(profile)

  const dashboard = useParentDashboardData(activeChildId)

  const parentWelcomeTitle = useMemo(() => {
    const first = profile?.firstname?.trim() ?? ''
    const last = profile?.lastname?.trim() ?? ''
    const full = `${first} ${last}`.trim()
    return full ? `Welkom, ${full} !` : 'Welkom'
  }, [profile])

  const mobileNavLabel = useMemo(() => {
    if (selectedChild) {
      const name = `${selectedChild?.firstname ?? ''} ${selectedChild?.lastname ?? ''}`.trim()
      return name || 'Kind'
    }
    return 'Dashboard'
  }, [selectedChild])

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
          headerLabel={mobileNavLabel}
        />

        <main ref={setMainRef} className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink max-lg:px-4 max-lg:py-6">
          <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-[#1a1a1a] max-lg:text-3xl max-sm:text-2xl">
            {parentWelcomeTitle}
          </h1>

          <OuderChildSwitcher
            className="mt-5 max-lg:mt-4"
            childrenList={activatedChildren}
            selectedChildId={activeChildId}
            onSelectChild={setSelectedChildId}
          />

          {pendingChildren.length > 0 ? (
            <div
              className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
              role="status"
            >
              <p className="text-sm font-semibold">
                {pendingChildren.length === 1
                  ? 'Er wacht een kind op activatie'
                  : `Er wachten ${pendingChildren.length} kinderen op activatie`}
              </p>
              <p className="mt-1 text-xs opacity-90">
                Activeer het account zodat je oefeningen en voortgang kunt volgen.
              </p>
              <Link
                to={`/dashboard/ouder/kind-activeren${buildChildSearch(pendingChildren[0]?.id)}`}
                className="mt-3 inline-flex text-sm font-bold text-nimbli underline-offset-2 hover:underline"
              >
                Kind nu activeren
              </Link>
            </div>
          ) : null}

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

          <div className="mt-6 rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3] max-lg:mt-5 max-lg:p-4">
            <div className="flex items-start gap-6 max-lg:gap-4">
              <div className="h-[125px] w-[125px] shrink-0 overflow-hidden rounded-lg border border-[#e1dbd3] shadow-[0_2px_0_0_#e1dbd3] max-lg:h-20 max-lg:w-20">
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
                <p className="font-nimbli-heading text-2xl font-bold text-[#1a1a1a] max-lg:text-xl max-sm:text-lg">{childLine}</p>
                <p className="mt-2 text-base text-[#1a1a1a] max-lg:mt-1 max-lg:text-sm">{memberSince}</p>
                <p className="mt-10 text-base text-[#1a1a1a] max-lg:mt-4 max-lg:text-sm">{goal}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid items-stretch gap-6 max-lg:mt-5 max-lg:gap-4 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
            <section className="flex min-h-0 w-full min-w-0 flex-col rounded-[14px] border-2 border-[#e1dbd3] bg-white px-[21px] pt-[21px] pb-[22px] shadow-[0_2px_0_0_#e1dbd3] max-lg:px-4 max-lg:pt-4 max-lg:pb-5">
              <header className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-2">
                <p className="font-nimbli-heading text-base font-bold text-[#1a1a1a]">Frequentie per week</p>
                <div className="flex items-center justify-between gap-3 lg:contents">
                  {dashboard.weekly?.monthLabel ? (
                    <span className="text-sm font-medium text-[#6b7280] lg:text-center">
                      {dashboard.weekly.monthLabel}
                    </span>
                  ) : (
                    <span aria-hidden className="hidden lg:block" />
                  )}
                  <div className="flex shrink-0 justify-end">
                    <OuderStatPill value={`${dashboard.weekly?.deltaPercent ?? 0}%`} />
                  </div>
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

            <section className="flex w-full min-w-0 flex-col rounded-[14px] border-2 border-[#e1dbd3] bg-white px-[21px] pt-[21px] pb-[22px] shadow-[0_2px_0_0_#e1dbd3] max-lg:px-4 max-lg:pt-4 max-lg:pb-5">
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

            <section className="w-full min-w-0 rounded-[14px] border-2 border-[#e1dbd3] bg-white px-[21px] pt-[21px] pb-[22px] shadow-[0_2px_0_0_#e1dbd3] max-lg:px-4 max-lg:pt-4 max-lg:pb-5">
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
              className="rounded-[14px] max-lg:px-4 max-lg:pt-4 max-lg:pb-5"
            />
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}
