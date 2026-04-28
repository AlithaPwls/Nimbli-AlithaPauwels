export default function OuderProgressRow({ label, value }) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#1a1a1a]">{label}</span>
        <span className="text-xs font-semibold text-nimbli">+{Math.round(safe)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#e5e7eb]">
        {/* Tailwind can’t express dynamic widths without inline styles; keep it minimal. */}
        <div
          className="h-2 rounded-full bg-nimbli"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  )
}

