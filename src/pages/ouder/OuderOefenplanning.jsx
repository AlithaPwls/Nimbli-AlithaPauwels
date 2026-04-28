import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useSearchParams } from 'react-router-dom'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderWeekStrip from '@/components/ouder/OuderWeekStrip.jsx'
import OuderUpcomingExercise from '@/components/ouder/OuderUpcomingExercise.jsx'
import OuderRecentRow from '@/components/ouder/OuderRecentRow.jsx'
import OuderPlannedExerciseRow from '@/components/ouder/OuderPlannedExerciseRow.jsx'
import { useChildrenForParent } from '@/hooks/ouder/useChildrenForParent.js'
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
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()
  const { children, loading: childrenLoading, error: childrenError } = useChildrenForParent(profile)

  const [searchParams, setSearchParams] = useSearchParams()
  const childParam = searchParams.get('child')
  const [selectedChildId, setSelectedChildId] = useState(childParam)

  useEffect(() => {
    setSelectedChildId(childParam)
  }, [childParam])

  useEffect(() => {
    if (!selectedChildId && (children ?? []).length > 0) {
      const first = children[0]?.id ?? null
      if (!first) return
      setSelectedChildId(first)
      const next = new URLSearchParams(searchParams)
      next.set('child', first)
      setSearchParams(next, { replace: true })
    }
  }, [children, selectedChildId, searchParams, setSearchParams])

  const [weekStart, setWeekStart] = useState(() => startOfWeekLocal(new Date()))

  const planning = useParentPlanningData(selectedChildId, weekStart)

  const selectedDay = useMemo(() => {
    return (planning.days ?? []).find((d) => d?.key === planning.selectedDayKey) ?? null
  }, [planning.days, planning.selectedDayKey])

  const plannedForSelectedDay = useMemo(() => {
    if (!planning.selectedDayKey) return []
    return planning.plannedByDay?.[planning.selectedDayKey] ?? []
  }, [planning.plannedByDay, planning.selectedDayKey])

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
            Oefenplanning
          </h1>

          <div className="mt-6 grid gap-6 lg:grid-cols-[590px_313px]">
            <OuderWeekStrip
              days={planning.days}
              activeKey={planning.selectedDayKey}
              onSelectDay={planning.setSelectedDayKey}
              onPrevWeek={() => setWeekStart((d) => startOfWeekLocal(addDaysLocal(d, -7)))}
              onNextWeek={() => setWeekStart((d) => startOfWeekLocal(addDaysLocal(d, 7)))}
              rangeLabel={planning.rangeLabel}
            />

            <section className="rounded-lg border-2 border-[#e1dbd3] bg-white px-[21px] pb-[22px] pt-[25px] shadow-[0_2px_0_0_#e1dbd3]">
              <p className="font-nimbli-heading text-lg font-bold text-[#1a1a1a]">Aankomende oefeningen</p>
              <div className="mt-5 flex flex-col gap-3">
                {planning.loading ? (
                  <div className="text-sm text-nimbli-muted">Laden…</div>
                ) : (
                  (planning.upcoming ?? []).map((u) => (
                    <OuderUpcomingExercise key={u.id} title={u.title} goal={u.goal} meta={u.meta} />
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[590px_313px]">
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
                      reps={p.reps}
                      minutes={p.minutes}
                      imageUrl={p.imageUrl}
                      done={p.done}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border-2 border-[#e1dbd3] bg-white px-[21px] pb-[22px] pt-[21px] shadow-[0_2px_0_0_#e1dbd3]">
              <p className="font-nimbli-heading text-base font-bold text-[#1a1a1a]">Recent</p>
              <div className="mt-4 flex flex-col gap-3">
                {planning.loading ? (
                  <div className="text-sm text-nimbli-muted">Laden…</div>
                ) : (
                  (planning.recent ?? []).map((r) => (
                    <OuderRecentRow key={r.id} title={r.title} time={r.time} xp={r.xp} />
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

