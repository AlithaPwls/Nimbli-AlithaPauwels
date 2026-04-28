import { ChevronRight, Pencil, Trash2 } from 'lucide-react'

const ICONS = {
  edit: Pencil,
  trash: Trash2,
  chevron: ChevronRight,
}

export default function OuderSettingsActionRow({ label, tone = 'normal', icon = 'chevron', onClick }) {
  const Icon = ICONS[icon] ?? ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex h-[46px] w-full items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-white px-[13px]',
        'transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
        tone === 'danger' ? 'text-[#ff8fab] hover:bg-[#fff1f3]' : 'text-[#1a1a1a] hover:bg-[#f9fafb]',
      ].join(' ')}
    >
      <span className="font-nimbli-heading text-sm font-semibold">{label}</span>
      <Icon className="size-4" aria-hidden />
    </button>
  )
}

