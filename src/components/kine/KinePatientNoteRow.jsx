import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function KinePatientNoteRow({ note, onEdit, onDelete }) {
  const metaParts = [note.authorName, note.createdAtLabel]
  if (note.updatedAtLabel) {
    metaParts.push(`bewerkt ${note.updatedAtLabel}`)
  }

  return (
    <article className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-nimbli-heading text-base font-bold text-nimbli-ink">{note.title}</h3>
          <p className="mt-1 text-xs text-nimbli-muted">{metaParts.join(' · ')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(note)}
            disabled={!onEdit}
            className="h-9 border-[#e1dbd3] font-nimbli-heading text-xs font-bold"
          >
            <Pencil className="mr-1.5 size-3.5" aria-hidden />
      
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete?.(note)}
            disabled={!onDelete}
            className="h-9 border-red-200 font-nimbli-heading text-xs font-bold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-1.5 size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-nimbli-ink">{note.content}</p>
    </article>
  )
}
