import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function KinePatientDeleteNoteDialog({
  open,
  onOpenChange,
  noteTitle,
  loading,
  error,
  onConfirm,
}) {
  const title = noteTitle?.trim() || 'deze notitie'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-nimbli-heading text-xl font-bold text-nimbli-ink">
            Notitie verwijderen?
          </DialogTitle>
          <DialogDescription className="text-sm text-nimbli-muted">
            Weet je zeker dat je <strong className="font-semibold text-nimbli-ink">{title}</strong> wilt
            verwijderen? Dit kan niet ongedaan worden gemaakt.
          </DialogDescription>
        </DialogHeader>

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
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void onConfirm()}
            className="font-nimbli-heading font-bold"
          >
            <Trash2 className="mr-2 size-4" aria-hidden />
            {loading ? 'Bezig…' : 'Verwijderen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
