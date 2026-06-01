import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function OuderBackLink({ to = -1, label = 'Terug', className }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={cn(
        'inline-flex items-center gap-2 text-[#302d2d] transition-colors hover:text-nimbli focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
        className
      )}
    >
      <ArrowLeft className="size-5" aria-hidden />
      <span className="font-nimbli-heading text-[18px] font-bold leading-[25.2px]">{label}</span>
    </button>
  )
}

