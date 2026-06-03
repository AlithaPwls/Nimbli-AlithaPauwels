import { useCallback, useMemo, useRef, useState } from 'react'
import ExerciseDetailDialog from '@/components/kine/ExerciseDetailDialog.jsx'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderMobileNav from '@/components/ouder/OuderMobileNav.jsx'
import OuderChildSwitcher from '@/components/ouder/OuderChildSwitcher.jsx'
import OuderWeekStrip from '@/components/ouder/OuderWeekStrip.jsx'
import OuderUpcomingExercise from '@/components/ouder/OuderUpcomingExercise.jsx'
import OuderRecentSection from '@/components/ouder/OuderRecentSection.jsx'
import OuderPlannedExerciseRow from '@/components/ouder/OuderPlannedExerciseRow.jsx'
import { useActiveChildSelection } from '@/hooks/ouder/useActiveChildSelection.js'
import { useParentPlanningData } from '@/hooks/ouder/useParentPlanningData.js'

function startOfWeekLocal(d) {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  const day = dt.getDay() // 0=Sun, 1=Mon
  const mondayOffset = (day + 6) % 7
  dt.setDate(dt.getDate() - mondayOffset)
  return dt
}

function addDaysLocal(d, days) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + days)
  return dt
}

function formatDayHeader(d) {
  const dt = new Date(d)
  const weekday = dt.toLocaleDateString('nl-BE', { weekday: 'long' })
  const month = dt.toLocaleDateString('nl-BE', { month: 'long' })
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dt.getDate()} ${month} ${dt.getFullYear()}`
}

export default function OuderOefenplanning() {
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
    loading: childrenLoading,
    error: childrenError,
    activeChildId,
    selectedChild,
    setSelectedChildId,
  } = useActiveChildSelection(profile)

  const [weekStart, setWeekStart] = useState(() => startOfWeekLocal(new Date()))
  const [selectedExercise, setSelectedExercise] = useState(null)

  const planning = useParentPlanningData(activeChildId, weekStart)

  const selectedDay = useMemo(() => {
    return (planning.days ?? []).find((d) => d?.key === planning.selectedDayKey) ?? null
  }, [planning.days, planning.selectedDayKey])

  const plannedForSelectedDay = useMemo(() => {
    if (!planning.selectedDayKey) return []
    return planning.plannedByDay?.[planning.selectedDayKey] ?? []
  }, [planning.plannedByDay, planning.selectedDayKey])

  const mobileNavLabel = useMemo(() => {
    if (selectedChild) {
      const name = `${selectedChild?.firstname ?? ''} ${selectedChild?.lastname ?? ''}`.trim()
      return name || 'Kind'
    }
    return 'Oefenplanning'
  }, [selectedChild])

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  if (!profile) {
    return <div className="text-center py-8">Profiel niet gevonden</div>
  }

  if (childrenError) {
    return <div className="text-center py-8">Fout bij laden van kinderen</div>
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
          headerLabel={mobileNavLabel}
        />

        <main ref={setMainRef} className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
          <ExerciseDetailDialog
            exercise={selectedExercise}
            onOpenChange={(open) => {
              if (!open) setSelectedExercise(null)
            }}
          />
          <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Oefenplanning
          </h1>

          <OuderChildSwitcher
            className="mt-5"
            childrenList={activatedChildren}
            selectedChildId={activeChildId}
            onSelectChild={setSelectedChildId}
          />

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[590px_313px]">
            <div className="flex min-w-0 flex-col gap-4">
              <OuderWeekStrip
                days={planning.days}
                activeKey={planning.selectedDayKey}
                onSelectDay={planning.setSelectedDayKey}
                onPrevWeek={() => setWeekStart((d) => startOfWeekLocal(addDaysLocal(d, -7)))}
                onNextWeek={() => setWeekStart((d) => startOfWeekLocal(addDaysLocal(d, 7)))}
                rangeLabel={planning.rangeLabel}
              />

              <section className="rounded-lg border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3]">
                <p className="font-nimbli-heading text-base font-bold text-[#1a1a1a]">
                  {selectedDay?.date ? formatDayHeader(selectedDay.date) : '—'}
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {planning.loading || childrenLoading ? (
                    <div className="text-sm text-nimbli-muted">Laden…</div>
                  ) : plannedForSelectedDay.length === 0 ? (
                    <div className="text-sm text-nimbli-muted">Geen oefeningen gepland.</div>
                  ) : (
                    plannedForSelectedDay.map((p) => (
                      <OuderPlannedExerciseRow
                        key={`${p.id}-${p.exerciseId}`}
                        title={p.title}
                        focus={p.focus}
                        categoryTone={p.categoryTone}
                        reps={p.reps}
                        minutes={p.minutes}
                        imageUrl={p.imageUrl}
                        done={p.done}
                        onSelect={
                          p.detail
                            ? () => setSelectedExercise(p.detail)
                            : undefined
                        }
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <section className="rounded-lg border-2 border-[#e1dbd3] bg-white px-[21px] pb-[22px] pt-[25px] shadow-[0_2px_0_0_#e1dbd3]">
                <p className="font-nimbli-heading text-lg font-bold text-[#1a1a1a]">Aankomende oefeningen</p>
                <div className="mt-5 flex flex-col gap-3">
                  {planning.loading ? (
                    <div className="text-sm text-nimbli-muted">Laden…</div>
                  ) : (
                    (planning.upcoming ?? []).map((u) => (
                      <OuderUpcomingExercise
                        key={u.id}
                        title={u.title}
                        focus={u.focus}
                        categoryTone={u.categoryTone}
                        reps={u.reps}
                        minutes={u.minutes}
                        imageUrl={u.imageUrl}
                        onSelect={
                          u.detail ? () => setSelectedExercise(u.detail) : undefined
                        }
                      />
                    ))
                  )}
                </div>
              </section>

              <OuderRecentSection
                items={planning.recent ?? []}
                loading={planning.loading}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}

