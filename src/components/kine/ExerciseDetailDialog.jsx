import { useMemo } from 'react'
import { Clock, Repeat2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  categoryToneClasses,
  exerciseDescriptionForDialog,
  youtubeEmbedUrl,
} from '@/lib/exerciseDisplay.js'

function ExerciseDetailMedia({ exercise }) {
  const poster =
    exercise.thumbnailUrl && exercise.thumbnailUrl !== exercise.videoUrl
      ? exercise.thumbnailUrl
      : null
  const embedSrc = exercise.youtubeUrl ? youtubeEmbedUrl(exercise.youtubeUrl) : null

  if (embedSrc) {
    return (
      <div className="overflow-hidden rounded-xl bg-black ring-1 ring-nimbli-slot-border/15">
        <div className="relative aspect-video w-full">
          <iframe
            src={embedSrc}
            title={`Video: ${exercise.title}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    )
  }

  if (exercise.videoUrl) {
    return (
      <div className="overflow-hidden rounded-xl bg-black ring-1 ring-nimbli-slot-border/15">
        <video
          src={exercise.videoUrl}
          poster={poster ?? undefined}
          className="aspect-video w-full object-contain"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
      <img
        src={exercise.thumbnailUrl || exercise.imageUrl}
        alt={exercise.title}
        className="aspect-video w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

export default function ExerciseDetailDialog({
  exercise,
  onOpenChange,
  onDelete,
  deleteDisabled = false,
}) {
  const bodyText = useMemo(
    () => (exercise ? exerciseDescriptionForDialog(exercise.description) : ''),
    [exercise]
  )

  return (
    <Dialog open={Boolean(exercise)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,800px)] gap-5 overflow-y-auto border-[#e1dbd3] p-6 sm:max-w-2xl">
        {exercise ? (
          <>
            <DialogHeader className="gap-3 text-left">
              <DialogTitle className="pr-8 font-nimbli-heading text-2xl font-bold text-nimbli-ink">
                {exercise.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {exercise.category}. Moeilijkheid: {exercise.difficulty}. {exercise.reps}{' '}
                herhalingen. Duur {exercise.time}.
                {bodyText ? ` Beschrijving: ${bodyText}` : ''}
              </DialogDescription>
              <span
                className={[
                  'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-[#302d2d]',
                  categoryToneClasses(exercise.categoryTone),
                ].join(' ')}
              >
                {exercise.category}
              </span>
            </DialogHeader>

            <ExerciseDetailMedia exercise={exercise} />

            <dl className="grid grid-cols-3 gap-2 text-sm text-nimbli-ink sm:gap-3">
              <div className="min-w-0 rounded-lg border border-[#e1dbd3] bg-nimbli-canvas/30 px-2 py-2 sm:px-3">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-nimbli-muted">
                  <Repeat2 className="size-3.5 shrink-0 text-[#302d2d]" aria-hidden />
                  Herhalingen
                </dt>
                <dd className="mt-1 font-nimbli-heading font-semibold">{exercise.reps}</dd>
              </div>
              <div className="min-w-0 rounded-lg border border-[#e1dbd3] bg-nimbli-canvas/30 px-2 py-2 sm:px-3">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-nimbli-muted">
                  <Clock className="size-3.5 shrink-0 text-[#302d2d]" aria-hidden />
                  Duur
                </dt>
                <dd className="mt-1 font-nimbli-heading font-semibold">{exercise.time}</dd>
              </div>
              <div className="min-w-0 rounded-lg border border-[#e1dbd3] bg-nimbli-canvas/30 px-2 py-2 sm:px-3">
                <dt className="text-xs font-medium text-nimbli-muted">Moeilijkheid</dt>
                <dd className="mt-1 font-nimbli-heading font-semibold">{exercise.difficulty}</dd>
              </div>
            </dl>

            <section className="space-y-2">
              <h3 className="font-nimbli-heading text-sm font-bold text-nimbli-ink">Beschrijving</h3>
              {bodyText ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-nimbli-ink">{bodyText}</p>
              ) : (
                <p className="text-sm text-nimbli-muted">Geen beschrijving beschikbaar.</p>
              )}
            </section>

            {onDelete ? (
              <div className="flex justify-center border-t border-[#e1dbd3] pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteDisabled}
                  onClick={onDelete}
                  className="font-nimbli-heading font-bold"
                >
                  <Trash2 className="mr-2 size-4" aria-hidden />
                  Oefening verwijderen
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
