import { useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function FieldBlock({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-nimbli-ink">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function PatientNoteDialog({
  open,
  onOpenChange,
  mode = 'create',
  initialNote = null,
  loading = false,
  error,
  onSubmit,
}) {
  const baseId = useId()
  const titleId = `${baseId}-title`
  const contentId = `${baseId}-content`
  const isEdit = mode === 'edit'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!open) return
    if (isEdit && initialNote) {
      setTitle(initialNote.title ?? '')
      setContent(initialNote.content ?? '')
    } else {
      setTitle('')
      setContent('')
    }
  }, [open, isEdit, initialNote])

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ title, content })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="font-nimbli-heading text-xl font-bold text-nimbli-ink">
            {isEdit ? 'Notitie bewerken' : 'Nieuwe notitie'}
          </DialogTitle>
          <DialogDescription className="text-sm text-nimbli-muted">
            {isEdit
              ? 'Pas de titel of tekst van deze notitie aan.'
              : 'Voeg een notitie toe aan het logboek van deze patiënt.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldBlock label="Titel" htmlFor={titleId}>
            <input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Voortgang na sessie"
              disabled={loading}
              className="h-10 w-full rounded-md border border-[#e1dbd3] bg-white px-3 text-sm text-nimbli-ink placeholder:text-nimbli-muted focus:border-nimbli focus:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30 disabled:opacity-60"
              autoComplete="off"
            />
          </FieldBlock>

          <FieldBlock label="Tekst" htmlFor={contentId}>
            <textarea
              id={contentId}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Schrijf je notitie…"
              rows={6}
              disabled={loading}
              className="w-full resize-y rounded-md border border-[#e1dbd3] bg-white px-3 py-2 text-sm text-nimbli-ink placeholder:text-nimbli-muted focus:border-nimbli focus:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30 disabled:opacity-60"
            />
          </FieldBlock>

          {error ? (
            <p className="text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="font-nimbli-heading"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-nimbli font-nimbli-heading font-bold text-white hover:bg-nimbli/90"
            >
              {loading ? 'Bezig…' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
