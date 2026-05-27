export default function KinePatientTabPlaceholder({ title }) {
  return (
    <div className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 py-16 text-center shadow-[0_2px_0_0_#e1dbd3]">
      <p className="font-nimbli-heading text-lg font-bold text-nimbli-ink">{title}</p>
      <p className="mt-2 text-sm text-nimbli-muted">Nog geen gegevens beschikbaar.</p>
    </div>
  )
}
