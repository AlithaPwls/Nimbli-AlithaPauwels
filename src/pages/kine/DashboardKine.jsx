import { Activity, ArrowDownAZ, ArrowUpAZ, Search, Target, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import KinePatientCard from '@/components/kine/KinePatientCard.jsx'
import KinePatientsEmptyState from '@/components/kine/KinePatientsEmptyState.jsx'
import KineStatCard from '@/components/kine/KineStatCard.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { useKinePatients } from '@/hooks/kine/useKinePatients'
import { useKineDashboardKpis } from '@/hooks/kine/useKineDashboardKpis'

export default function DashboardKine() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [nameSort, setNameSort] = useState('asc')

  const practiceId = profile?.practice_id ?? null
  const { kpis, loading: kpisLoading } = useKineDashboardKpis({ practiceId })
  const { patients, loading: patientsLoading } = useKinePatients({ practiceId, query, nameSort })

  const greetingName = useMemo(() => {
    const first = profile?.firstname?.trim()
    const last = profile?.lastname?.trim()
    const combined = [first, last].filter(Boolean).join(' ')
    return combined || 'kinesist'
  }, [profile?.firstname, profile?.lastname])

  const goAddPatient = () => navigate('/dashboard/kine/patienten/nieuw')
  const goPatientDetail = (patient) => navigate(`/dashboard/kine/patienten/${patient.id}`)

  const totalPatients = kpis.totalPatients
  const adherenceDisplay =
    kpisLoading ? '…' : kpis.adherencePct == null ? '--' : `${kpis.adherencePct}%`
  const successRateDisplay =
    kpisLoading ? '…' : kpis.successRatePct == null ? '--' : `${kpis.successRatePct}%`

  const adherenceProgress =
    kpis.adherencePct == null ? null : Math.min(1, Math.max(0, kpis.adherencePct / 100))
  const successRateProgress =
    kpis.successRatePct == null ? null : Math.min(1, Math.max(0, kpis.successRatePct / 100))

  const showFigmaEmpty = !patientsLoading && patients.length === 0 && !query.trim()
  const showNoSearchResults = !patientsLoading && patients.length === 0 && query.trim()

  return (
    <div className="min-h-svh bg-nimbli-foreground">
      <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink max-lg:px-4 max-lg:py-6">
        <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-black max-lg:text-3xl max-sm:text-2xl">
          Goeiedag {greetingName}!
        </h1>

        <div className="mt-8 grid grid-cols-3 gap-5 max-lg:mt-6 max-lg:gap-3 max-sm:gap-2">
          <KineStatCard
            title="Totaal Patiënten"
            value={kpisLoading ? '…' : String(totalPatients)}
            subtitle="Actieve behandeltrajecten"
            accent="nimbli"
            Icon={Users}
          />
          <KineStatCard
            title="Gemiddeld"
            value={adherenceDisplay}
            subtitle="Therapietrouw"
            accent="yellow"
            progress={adherenceProgress}
            Icon={Activity}
          />
          <KineStatCard
            title="Succesrate"
            value={successRateDisplay}
            subtitle="Gemiddeld deze week"
            accent="blue"
            progress={successRateProgress}
            Icon={Target}
          />
        </div>

        <div className="mt-10 flex flex-col gap-5 max-lg:mt-8 max-lg:gap-4">
          <div className="flex flex-row items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
            <h2 className="font-nimbli-heading text-xl font-bold text-[#1a1a1a]">Mijn Patiënten</h2>
            <Button
              type="button"
              className="h-10 w-auto rounded bg-nimbli font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 max-lg:w-full"
              onClick={goAddPatient}
            >
              <UserPlus className="mr-2 size-[18px]" aria-hidden />
              Patiënt toevoegen
            </Button>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <label className="sr-only" htmlFor="kine-patient-search">
                Zoek patiënt
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-nimbli-muted"
                aria-hidden
              />
              <input
                id="kine-patient-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek patiënt..."
                className="h-[46px] w-full rounded-[10px] border border-[#e5e7eb] bg-white py-3 pl-11 pr-4 text-base text-nimbli-ink placeholder:text-[rgba(10,10,10,0.5)] focus:outline-none focus:ring-2 focus:ring-nimbli/30 lg:text-sm"
                type="search"
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
            <button
              type="button"
              id="kine-patient-sort"
              aria-label={
                nameSort === 'desc'
                  ? 'Sorteer op naam van Z naar A'
                  : 'Sorteer op naam van A naar Z'
              }
              title={nameSort === 'desc' ? 'Naam Z → A' : 'Naam A → Z'}
              onClick={() => setNameSort((s) => (s === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-nimbli-muted transition-colors hover:border-nimbli/40 hover:text-nimbli-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30"
            >
              {nameSort === 'desc' ? (
                <ArrowDownAZ className="size-[18px] shrink-0" aria-hidden />
              ) : (
                <ArrowUpAZ className="size-[18px] shrink-0" aria-hidden />
              )}
            </button>
          </div>

          {patientsLoading ? (
            <div className="rounded-2xl border-2 border-[#e1dbd3] bg-white px-4 py-12 text-center text-sm text-nimbli-muted shadow-[0_2px_0_0_#e1dbd3] max-lg:px-3 max-lg:py-8">
              Patiënten laden…
            </div>
          ) : showNoSearchResults ? (
            <div className="rounded-2xl border-2 border-[#e1dbd3] bg-white px-4 py-12 text-center text-sm text-nimbli-muted shadow-[0_2px_0_0_#e1dbd3] max-lg:px-3 max-lg:py-8">
              <p className="break-words">
                Geen patiënten gevonden voor “{query.trim()}”.
              </p>
            </div>
          ) : showFigmaEmpty ? (
            <KinePatientsEmptyState onAddPatient={goAddPatient} />
          ) : (
            <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
              {patients.map((patient) => (
                <KinePatientCard key={patient.id} patient={patient} onSelect={goPatientDetail} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
