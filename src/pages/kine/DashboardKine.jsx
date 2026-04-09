import { Activity, Search, Target, UserPlus, Users } from 'lucide-react'
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

  const practiceId = profile?.practice_id ?? null
  const { kpis, loading: kpisLoading } = useKineDashboardKpis({ practiceId })
  const { patients, loading: patientsLoading } = useKinePatients({ practiceId, query })

  const greetingName = useMemo(() => {
    const first = profile?.firstname?.trim()
    const last = profile?.lastname?.trim()
    const combined = [first, last].filter(Boolean).join(' ')
    return combined || 'kinesist'
  }, [profile?.firstname, profile?.lastname])

  const goAddPatient = () => navigate('/dashboard/kine/patienten/nieuw')

  const totalPatients = kpis.totalPatients
  const adherenceDisplay =
    kpisLoading ? '…' : kpis.adherencePct == null ? '--' : `${kpis.adherencePct}%`
  const complianceDisplay =
    kpisLoading ? '…' : kpis.compliancePct == null ? '--' : `${kpis.compliancePct}%`

  const adherenceProgress =
    kpis.adherencePct == null ? null : Math.min(1, Math.max(0, kpis.adherencePct / 100))
  const complianceProgress =
    kpis.compliancePct == null ? null : Math.min(1, Math.max(0, kpis.compliancePct / 100))

  const showFigmaEmpty = !patientsLoading && patients.length === 0 && !query.trim()
  const showNoSearchResults = !patientsLoading && patients.length === 0 && query.trim()

  return (
    <div className="min-h-svh bg-nimbli-foreground">
      <div className="mx-auto max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
        <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-black">
          Goeiedag {greetingName}!
        </h1>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
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
            title="Compliance"
            value={complianceDisplay}
            subtitle="Gemiddelde rate"
            accent="blue"
            progress={complianceProgress}
            Icon={Target}
          />
        </div>

        <div className="mt-10 flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-nimbli-heading text-xl font-bold text-[#1a1a1a]">Mijn Patiënten</h2>
            <Button
              type="button"
              className="h-10 rounded bg-nimbli font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90"
              onClick={goAddPatient}
            >
              <UserPlus className="mr-2 size-[18px]" aria-hidden />
              Patiënt toevoegen
            </Button>
          </div>

          <div>
            <label className="sr-only" htmlFor="kine-patient-search">
              Zoek patiënt
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-nimbli-muted"
                aria-hidden
              />
              <input
                id="kine-patient-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek patiënt..."
                className="h-[46px] w-full rounded-[10px] border border-[#e5e7eb] bg-white py-3 pl-11 pr-4 text-sm text-nimbli-ink placeholder:text-[rgba(10,10,10,0.5)] focus:outline-none focus:ring-2 focus:ring-nimbli/30"
                type="search"
                autoComplete="off"
              />
            </div>
          </div>

          {patientsLoading ? (
            <div className="rounded-2xl border-2 border-[#e1dbd3] bg-white px-4 py-12 text-center text-sm text-nimbli-muted shadow-[0_2px_0_0_#e1dbd3]">
              Patiënten laden…
            </div>
          ) : showNoSearchResults ? (
            <div className="rounded-2xl border-2 border-[#e1dbd3] bg-white px-4 py-12 text-center text-sm text-nimbli-muted shadow-[0_2px_0_0_#e1dbd3]">
              Geen patiënten gevonden voor “{query.trim()}”.
            </div>
          ) : showFigmaEmpty ? (
            <KinePatientsEmptyState onAddPatient={goAddPatient} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {patients.map((patient) => (
                <KinePatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
