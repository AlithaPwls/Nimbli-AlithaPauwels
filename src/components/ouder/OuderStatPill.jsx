import { TrendingUp } from 'lucide-react'

export default function OuderStatPill({ value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-nimbli/15 px-2.5 py-1 text-xs font-bold text-nimbli">
      <TrendingUp className="size-3.5" aria-hidden />
      {value}
    </span>
  )
}

