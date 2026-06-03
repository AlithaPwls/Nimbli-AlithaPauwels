import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const actionButtonClass =
  'font-nimbli-heading text-xs font-bold max-sm:size-8 max-sm:px-0'

export default function KinePatientNoteRow({ note, onEdit, onDelete }) {
  const metaParts = [note.authorName, note.createdAtLabel]
  if (note.updatedAtLabel) {
    metaParts.push(`bewerkt ${note.updatedAtLabel}`)
  }

  return (
    <article
      className={cn(
        'rounded-xl border border-[#e5e7eb] bg-white px-5 py-4',
        'max-sm:rounded-2xl max-sm:border-2 max-sm:border-[#e1dbd3] max-sm:p-3 max-sm:shadow-[0_2px_0_0_#e1dbd3]'
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 font-nimbli-heading text-base font-bold leading-snug text-nimbli-ink line-clamp-2 max-sm:text-sm">
              {note.title}
            </h3>

            <div className="flex shrink-0 gap-1.5 sm:hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onEdit?.(note)}
                disabled={!onEdit}
                aria-label="Notitie bewerken"
                className={cn(actionButtonClass, 'border-[#e1dbd3]')}
              >
                <Pencil className="size-3.5" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onDelete?.(note)}
                disabled={!onDelete}
                aria-label="Notitie verwijderen"
                className={cn(actionButtonClass, 'border-red-200 text-destructive hover:bg-destructive/10')}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </div>
          </div>

          <p className="mt-1 hidden text-[11px] leading-snug text-nimbli-muted max-sm:block">
            <span className="block font-semibold text-nimbli-ink/90">{note.authorName}</span>
            <span className="mt-0.5 block">
              {note.updatedAtLabel ? (
                <>
                  {note.createdAtLabel}
                  {' — '}
                  <span className="italic">bewerkt {note.updatedAtLabel}</span>
                </>
              ) : (
                note.createdAtLabel
              )}
            </span>
          </p>
          <p className="mt-1 hidden text-xs text-nimbli-muted sm:block">{metaParts.join(' · ')}</p>
        </div>

        <div className="hidden shrink-0 flex-wrap gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(note)}
            disabled={!onEdit}
            aria-label="Notitie bewerken"
            className="h-9 border-[#e1dbd3] font-nimbli-heading text-xs font-bold"
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete?.(note)}
            disabled={!onDelete}
            aria-label="Notitie verwijderen"
            className="h-9 border-red-200 font-nimbli-heading text-xs font-bold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-nimbli-ink max-sm:mt-2 max-sm:text-[13px] sm:mt-3">
        {note.content}
      </p>
    </article>
  )
}
