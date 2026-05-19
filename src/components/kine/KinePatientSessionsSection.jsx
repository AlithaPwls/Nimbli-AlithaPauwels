import KinePatientSessionRow from '@/components/kine/KinePatientSessionRow.jsx'

export default function KinePatientSessionsSection({
  sessions = [],
  loading = false,
  patientName = 'de patiënt',
}) {
  const list = Array.isArray(sessions) ? sessions : []
  const isEmpty = !loading && list.length === 0

  return (
    <section className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 pb-8 pt-8 shadow-[0_2px_0_0_#e1dbd3]">
      <header>
        <h2 className="font-nimbli-heading text-[22px] font-bold text-[#1a1a1a]">Sessies</h2>
        <p className="mt-1 text-[15px] text-nimbli-muted">Alle voltooide oefeningen</p>
      </header>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-nimbli-muted">Sessies laden…</p>
        ) : isEmpty ? (
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-6 py-12 text-center">
            <p className="font-nimbli-heading text-base font-bold text-nimbli-ink">
              Nog geen sessies beschikbaar
            </p>
            <p className="mt-2 text-sm text-nimbli-muted">
              Zodra {patientName} een oefening voltooit, verschijnt die hier.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((session) => (
              <li key={session.id}>
                <KinePatientSessionRow
                  title={session.title}
                  time={session.time}
                  score={session.score}
                  success={session.success}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
