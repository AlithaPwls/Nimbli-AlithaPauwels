import { Plus } from 'lucide-react'
import KinePatientNoteRow from '@/components/kine/KinePatientNoteRow.jsx'
import { Button } from '@/components/ui/button'

export default function KinePatientLogboekSection({
  notes = [],
  loading = false,
  patientName = 'de patiënt',
  onNewNote,
  onEditNote,
  onDeleteNote,
}) {
  const list = Array.isArray(notes) ? notes : []
  const isEmpty = !loading && list.length === 0

  return (
    <section className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 pb-8 pt-8 shadow-[0_2px_0_0_#e1dbd3] max-lg:px-5 max-lg:pb-6 max-lg:pt-6 max-sm:px-4 max-sm:pb-5 max-sm:pt-5">
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h2 className="font-nimbli-heading text-[22px] font-bold text-[#1a1a1a] max-sm:text-lg">Logboek</h2>
          <Button
            type="button"
            disabled={!onNewNote}
            onClick={onNewNote}
            className="h-11 w-full shrink-0 rounded bg-nimbli font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 disabled:opacity-60 sm:w-auto"
          >
            <Plus className="mr-2 size-[18px]" aria-hidden />
            Nieuwe notitie
          </Button>
        </div>
        <p className="mt-1 text-[15px] text-nimbli-muted max-sm:text-sm">Notities over {patientName}</p>
      </header>

      <div className="mt-6 max-sm:mt-4">
        {loading ? (
          <p className="text-sm text-nimbli-muted">Notities laden…</p>
        ) : isEmpty ? (
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-6 py-12 text-center">
            <p className="font-nimbli-heading text-base font-bold text-nimbli-ink">Nog geen notities</p>
            <p className="mt-2 text-sm text-nimbli-muted">
              Voeg een notitie toe via &quot;Nieuwe notitie&quot; om het logboek te starten.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {list.map((note) => (
              <li key={note.id}>
                <KinePatientNoteRow note={note} onEdit={onEditNote} onDelete={onDeleteNote} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
