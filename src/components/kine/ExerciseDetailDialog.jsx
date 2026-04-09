import { useMemo } from 'react'
import { Clock, Repeat2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { categoryToneClasses, exerciseDescriptionForDialog } from '@/lib/exerciseDisplay.js'

export default function ExerciseDetailDialog({ exercise, onOpenChange }) {
  const bodyText = useMemo(
    () => (exercise ? exerciseDescriptionForDialog(exercise.description) : ''),
    [exercise]
  )

  return (
    <Dialog open={Boolean(exercise)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] gap-4 overflow-y-auto sm:max-w-lg">
        {exercise ? (
          <>
            <DialogHeader className="gap-3 text-left">
              <DialogTitle className="pr-8 font-nimbli-heading text-xl font-bold text-nimbli-ink">
                {exercise.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {exercise.category}. Moeilijkheid: {exercise.difficulty}. {exercise.reps}{' '}
                herhalingen. Duur {exercise.time}.
                {bodyText ? ` Instructies: ${bodyText}` : ''}
              </DialogDescription>
              <span
                className={[
                  'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-[#302d2d]',
                  categoryToneClasses(exercise.categoryTone),
                ].join(' ')}
              >
                {exercise.category}
              </span>
            </DialogHeader>

            <div className="overflow-hidden rounded-xl bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
              <img
                src={exercise.imageUrl}
                alt={exercise.title}
                className="aspect-video w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>

            <dl className="grid gap-3 text-sm text-nimbli-ink sm:grid-cols-3">
              <div className="rounded-lg border border-nimbli-slot-border/40 bg-nimbli-canvas/30 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-nimbli-muted">
                  <Repeat2 className="size-3.5 shrink-0 text-[#302d2d]" aria-hidden />
                  Herhalingen
                </dt>
                <dd className="mt-1 font-nimbli-heading font-semibold">{exercise.reps}</dd>
              </div>
              <div className="rounded-lg border border-nimbli-slot-border/40 bg-nimbli-canvas/30 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-nimbli-muted">
                  <Clock className="size-3.5 shrink-0 text-[#302d2d]" aria-hidden />
                  Duur
                </dt>
                <dd className="mt-1 font-nimbli-heading font-semibold">{exercise.time}</dd>
              </div>
              <div className="rounded-lg border border-nimbli-slot-border/40 bg-nimbli-canvas/30 px-3 py-2 sm:col-span-1">
                <dt className="text-xs font-medium text-nimbli-muted">Moeilijkheid</dt>
                <dd className="mt-1 font-nimbli-heading font-semibold">{exercise.difficulty}</dd>
              </div>
            </dl>

            {bodyText ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-nimbli-ink">{bodyText}</p>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
