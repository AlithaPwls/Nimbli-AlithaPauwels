import { Activity, Search, Target, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth.js'
import { useKinePatients } from '@/hooks/kine/useKinePatients'
import { useKineDashboardKpis } from '@/hooks/kine/useKineDashboardKpis'

function clampProgress(progress) {
  const safe = Number.isFinite(progress) ? progress : 0
  return Math.min(1, Math.max(0, safe))
}

function progressValue(progress) {
  return Math.round(clampProgress(progress) * 100)
}

function StatCard({ title, value, subtitle, accent = 'nimbli', progress = null, Icon }) {
  const barValue = progress == null ? null : progressValue(progress)

  const accentText =
    accent === 'yellow' ? 'text-[#FBB92A]' : accent === 'blue' ? 'text-[#82B3E1]' : 'text-nimbli'
  const accentBg =
    accent === 'yellow' ? 'bg-[#FBB92A]/20' : accent === 'blue' ? 'bg-[#82B3E1]/20' : 'bg-nimbli/15'
  const accentAccent =
    accent === 'yellow'
      ? 'accent-[#FBB92A]'
      : accent === 'blue'
        ? 'accent-[#82B3E1]'
        : 'accent-nimbli'

  return (
    <div className="rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3]">
      <div className="flex items-start gap-3">
        <div className={['mt-0.5 grid size-8 place-items-center rounded-xl', accentBg, accentText].join(' ')}>
          {Icon ? <Icon className="size-4" aria-hidden /> : null}
        </div>
        <div className="min-w-0">
          <p className="font-nimbli-heading text-sm font-bold text-nimbli-muted">{title}</p>
          <p
            className={[
              'mt-3 font-nimbli-heading text-3xl font-extrabold tracking-tight',
              accent === 'nimbli' ? 'text-nimbli' : accent === 'yellow' ? 'text-[#FBB92A]' : 'text-[#82B3E1]',
            ].join(' ')}
          >
            {value}
          </p>
          {subtitle ? <p className="mt-1 text-xs text-nimbli-muted">{subtitle}</p> : null}

          {barValue != null ? (
            <progress
              className={['mt-3 h-1.5 w-full overflow-hidden rounded-full bg-nimbli-canvas', accentAccent].join(
                ' '
              )}
              value={barValue}
              max={100}
              aria-label={`${title} ${barValue}%`}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function formatPct(progress) {
  return `${Math.round(clampProgress(progress) * 100)}%`
}

function PatientCard({ patient }) {
  const pct = formatPct(patient.progress)
  const barValue = progressValue(patient.progress)

  return (
    <button
      type="button"
      className="group relative w-full cursor-pointer rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 text-left shadow-[0_2px_0_0_#e1dbd3] transition-colors hover:border-nimbli/50 hover:bg-nimbli-canvas/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
    >
      <div className="flex items-start gap-4">
        <img
          className="mt-0.5 size-12 shrink-0 rounded-xl object-cover ring-1 ring-nimbli-slot-border/20"
          src={patient.avatarUrl}
          alt={`${patient.name} profielfoto`}
          loading="lazy"
          decoding="async"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-nimbli-heading text-base font-extrabold text-nimbli-ink">
                {patient.name}
              </p>
              <p className="mt-0.5 text-xs text-nimbli-muted">{patient.age} jaar</p>
            </div>
            <p className="shrink-0 text-xs font-semibold text-nimbli">{patient.delta}</p>
          </div>

          <p className="mt-3 line-clamp-2 text-xs text-nimbli-muted">{patient.focus}</p>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-nimbli-muted">
            <span className="size-2 rounded-full bg-nimbli" aria-hidden />
            <span className="truncate">Laatste sessie: {patient.lastSession}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <progress
              className="h-2 flex-1 overflow-hidden rounded-full bg-nimbli-canvas accent-[#82B3E1]"
              value={barValue}
              max={100}
              aria-label={`Voortgang ${patient.name} ${barValue}%`}
            />
            <p className="w-10 text-right text-[11px] font-semibold text-nimbli-muted">{pct}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

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

  const totalPatients = kpis.totalPatients
  const adherenceValue = kpis.adherencePct == null ? '—' : `${kpis.adherencePct}%`
  const complianceValue = kpis.compliancePct == null ? '—' : `${kpis.compliancePct}%`

  return (
    <div className="min-h-svh bg-nimbli-foreground">
      <div className="mx-auto max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
        <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight">
          Goeiedag {greetingName}!
        </h1>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <StatCard
            title="Totaal Patiënten"
            value={kpisLoading ? '…' : String(totalPatients)}
            subtitle="Actieve behandeltrajecten"
            accent="nimbli"
            Icon={Users}
          />
          <StatCard
            title="Gemiddeld"
            value={adherenceValue}
            subtitle="Therapietrouw"
            accent="yellow"
            progress={kpis.adherencePct == null ? null : kpis.adherencePct / 100}
            Icon={Activity}
          />
          <StatCard
            title="Compliance"
            value={complianceValue}
            subtitle="Gemiddelde rate"
            accent="blue"
            progress={kpis.compliancePct == null ? null : kpis.compliancePct / 100}
            Icon={Target}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-nimbli-heading text-2xl font-extrabold">Mijn Patiënten</h2>
          <Button
            type="button"
            className="h-10 bg-nimbli font-nimbli-heading font-black text-nimbli-foreground hover:bg-nimbli/90"
            onClick={() => navigate('/dashboard/kine/patienten/nieuw')}
          >
            <UserPlus className="mr-2 size-4" aria-hidden />
            Patiënt toevoegen
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border-2 border-[#e1dbd3] bg-white p-5 shadow-[0_2px_0_0_#e1dbd3]">
          <label className="sr-only" htmlFor="kine-patient-search">
            Zoek patiënt
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
            <Search className="size-4 text-nimbli-muted" aria-hidden />
            <input
              id="kine-patient-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek patiënt..."
              className="w-full bg-transparent text-sm text-nimbli-ink placeholder:text-nimbli-muted focus:outline-none"
              type="text"
              autoComplete="off"
            />
          </div>

          {patientsLoading ? (
            <div className="mt-6 rounded-xl bg-nimbli-canvas px-4 py-6 text-center text-sm text-nimbli-muted">
              Patiënten laden…
            </div>
          ) : patients.length === 0 ? (
            <div className="mt-6 rounded-xl bg-nimbli-canvas px-4 py-6 text-center text-sm text-nimbli-muted">
              {query.trim()
                ? `Geen patiënten gevonden voor “${query.trim()}”.`
                : 'Nog geen patiënten. Voeg je eerste patiënt toe.'}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {patients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
