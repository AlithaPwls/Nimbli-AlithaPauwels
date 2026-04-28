import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Minus, Plus, Upload, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { createPracticeExercise } from '@/hooks/kine/createPracticeExercise.js'
import {
  DIFFICULTY_OPTIONS,
  GOAL_OPTIONS,
  difficultyLabelFromId,
} from '@/lib/kineExerciseFormConstants.js'

function clampInt(n, min, max) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function FieldBlock({ label, htmlFor, placeholder, value, onChange, inputProps = {} }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-nimbli-ink">
        {label}
      </label>
      <input
        id={htmlFor}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-[#e1dbd3] bg-white px-3 text-sm text-nimbli-ink placeholder:text-nimbli-muted transition-colors duration-200 motion-reduce:transition-none focus:border-nimbli focus:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30"
        {...inputProps}
      />
    </div>
  )
}

/** Matches oefeningen-bibliotheek filter chips (KineOefeningenEigenVideos). */
function ChoiceChipRow({ label, labelId, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span id={labelId} className="text-sm font-medium text-nimbli-ink">
        {label}
      </span>
      <div
        className="flex flex-wrap gap-3"
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {options.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.id)}
              className={[
                'h-11 cursor-pointer rounded border px-5 font-nimbli-heading text-sm font-bold transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
                active
                  ? 'border-nimbli bg-nimbli text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]'
                  : 'border-nimbli bg-white text-[#6b7280] hover:bg-nimbli/5',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CounterField({ label, htmlFor, value, onChange, min, max }) {
  function setValue(next) {
    onChange(clampInt(typeof next === 'number' ? next : parseInt(String(next), 10), min, max))
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-nimbli-ink">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Verlagen"
          disabled={value <= min}
          onClick={() => setValue(value - 1)}
          className="flex size-9 cursor-pointer items-center justify-center rounded-md border border-[#e1dbd3] bg-white text-nimbli-ink transition-colors duration-200 motion-reduce:transition-none hover:bg-nimbli-canvas/80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30"
        >
          <Minus className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
        <input
          id={htmlFor}
          inputMode="numeric"
          autoComplete="off"
          required
          min={min}
          max={max}
          value={String(value)}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '')
            if (raw === '') {
              onChange(min)
              return
            }
            onChange(clampInt(parseInt(raw, 10), min, max))
          }}
          onBlur={() => {
            if (!Number.isFinite(value) || value < min) onChange(min)
          }}
          className="h-9 w-14 rounded-md border border-[#e1dbd3] bg-white text-center font-nimbli-body text-sm font-semibold text-nimbli-ink tabular-nums transition-colors duration-200 motion-reduce:transition-none [appearance:textfield] focus:border-nimbli focus:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="Verhogen"
          disabled={value >= max}
          onClick={() => setValue(value + 1)}
          className="flex size-9 cursor-pointer items-center justify-center rounded-md border border-[#e1dbd3] bg-white text-nimbli-ink transition-colors duration-200 motion-reduce:transition-none hover:bg-nimbli-canvas/80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30"
        >
          <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  )
}

/**
 * Compact modal: nieuwe oefening (clean layout, Nimbli tokens, Lucide icons).
 */
export default function AddExerciseDialog({ open, onOpenChange, onSaved, practiceId }) {
  const baseId = useId()
  const fileInputRef = useRef(null)
  const measureVideoRef = useRef(null)

  const [name, setName] = useState('')
  const [goalId, setGoalId] = useState('mobiliteit')
  const [repsCount, setRepsCount] = useState(10)
  const [difficultyId, setDifficultyId] = useState('gemiddeld')
  const [durationMinutes, setDurationMinutes] = useState(5)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [videoError, setVideoError] = useState(null)
  const [saveError,   setSaveError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const revokePreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setFile(null)
  }, [])

  useEffect(() => {
    if (!open) return
    setSaveError(null)
    setName('')
    setGoalId('mobiliteit')
    setRepsCount(10)
    setDifficultyId('gemiddeld')
    setDurationMinutes(5)
    setVideoError(null)
    setDragActive(false)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setFile(null)
  }, [open])

  function handleOpenChange(next) {
    if (!next) {
      if (submitting) return
      revokePreview()
      setSaveError(null)
      setName('')
      setGoalId('mobiliteit')
      setRepsCount(10)
      setDifficultyId('gemiddeld')
      setDurationMinutes(5)
      setVideoError(null)
      setDragActive(false)
    }
    onOpenChange(next)
  }

  function applyVideoFile(next) {
    if (!next) {
      revokePreview()
      return
    }
    const okType =
      next.type.startsWith('video/') ||
      /\.(mp4|mov|avi)$/i.test(next.name)
    if (!okType) {
      setVideoError('Gebruik MP4, MOV of AVI.')
      return
    }
    setVideoError(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(next)
    })
    setFile(next)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) applyVideoFile(dropped)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const title = name.trim()
    if (!title) return
    if (!practiceId) {
      setSaveError('Geen praktijk gevonden. Vernieuw de pagina of log opnieuw in.')
      return
    }

    const repsN = clampInt(repsCount, 1, 99)
    const durationN = clampInt(durationMinutes, 1, 240)
    const diffLabel = difficultyLabelFromId(difficultyId)

    if (previewUrl && measureVideoRef.current) {
      const el = measureVideoRef.current
      el.src = previewUrl
      await new Promise((resolve) => {
        const done = () => {
          el.removeEventListener('loadedmetadata', done)
          el.removeEventListener('error', done)
          resolve()
        }
        if (Number.isFinite(el.duration) && el.duration > 0) {
          resolve()
          return
        }
        el.addEventListener('loadedmetadata', done)
        el.addEventListener('error', done)
      })
      const d = measureVideoRef.current.duration
      if (Number.isFinite(d) && d > 60) {
        setVideoError('Video mag maximaal 60 seconden zijn.')
        return
      }
    }

    const fileToUpload = file
    const blobUrl = previewUrl

    setSaveError(null)
    setSubmitting(true)
    try {
      const result = await createPracticeExercise({
        practiceId,
        title,
        goalId,
        difficultyId,
        repsCount: repsN,
        durationMinutes: durationN,
        file: fileToUpload,
      })

      if (!result.ok) {
        setSaveError(result.message || 'Opslaan mislukt.')
        return
      }

      if (blobUrl) URL.revokeObjectURL(blobUrl)
      setPreviewUrl(null)
      setFile(null)
      onSaved?.()
      onOpenChange(false)
    } catch {
      setSaveError('Er ging iets mis. Probeer later opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  const idName = `${baseId}-name`
  const idGoalGroup = `${baseId}-goal`
  const idReps = `${baseId}-reps`
  const idDuration = `${baseId}-duration`
  const idDiffGroup = `${baseId}-difficulty`
  const idFile = `${baseId}-file`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(92vh,720px)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-xl border border-[#e1dbd3] bg-white p-0 shadow-sm ring-0 sm:max-w-2xl"
      >
        <DialogDescription className="sr-only">
          Formulier: naam, doel (categorie), herhalingen, moeilijkheid, duur, optioneel video.
        </DialogDescription>

        <header className="flex items-start justify-between gap-3 border-b border-[#e1dbd3] px-5 py-4">
          <DialogTitle className="pr-2 text-left font-nimbli-heading text-lg font-bold tracking-tight text-nimbli-ink">
            Nieuwe oefening
          </DialogTitle>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleOpenChange(false)}
            className="cursor-pointer rounded-md p-2 text-nimbli-muted transition-colors duration-200 motion-reduce:transition-none hover:bg-nimbli-canvas/80 hover:text-nimbli-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Sluiten"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-5 py-4 lg:grid-cols-[1fr_min(220px,100%)] lg:gap-5">
            <div className="flex min-w-0 flex-col gap-3.5">
              <FieldBlock
                label="Naam *"
                htmlFor={idName}
                placeholder="Bv. superheldsprong"
                value={name}
                onChange={setName}
                inputProps={{ required: true, autoComplete: 'off' }}
              />
              <ChoiceChipRow
                label="Doel *"
                labelId={idGoalGroup}
                options={GOAL_OPTIONS}
                value={goalId}
                onChange={setGoalId}
              />
              <CounterField
                label="Herhalingen *"
                htmlFor={idReps}
                value={repsCount}
                onChange={setRepsCount}
                min={1}
                max={99}
              />
              <ChoiceChipRow
                label="Moeilijkheid *"
                labelId={idDiffGroup}
                options={DIFFICULTY_OPTIONS}
                value={difficultyId}
                onChange={setDifficultyId}
              />
              <CounterField
                label="Duur (min) *"
                htmlFor={idDuration}
                value={durationMinutes}
                onChange={setDurationMinutes}
                min={1}
                max={240}
              />
            </div>

            <div className="flex min-h-0 flex-col lg:min-w-0">
              <input
                ref={fileInputRef}
                id={idFile}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) applyVideoFile(f)
                  e.target.value = ''
                }}
              />
              <label
                htmlFor={idFile}
                onDragEnter={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={[
                  'flex min-h-[168px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-4 text-center transition-colors duration-200 motion-reduce:transition-none',
                  dragActive
                    ? 'border-nimbli bg-nimbli/10'
                    : 'border-nimbli/35 bg-nimbli-canvas/40 hover:border-nimbli/50 hover:bg-nimbli-canvas/60',
                ].join(' ')}
              >
                <Upload className="size-7 shrink-0 text-nimbli" strokeWidth={1.75} aria-hidden />
                <span className="text-xs font-medium text-nimbli-ink">Video (optioneel)</span>
                <span className="text-[11px] leading-tight text-nimbli-muted">Max. 60s · MP4, MOV, AVI</span>
                {file ? (
                  <span className="mt-0.5 max-w-full truncate px-1 text-[11px] font-medium text-nimbli-ink">
                    {file.name}
                  </span>
                ) : null}
              </label>
              {videoError ? (
                <p className="mt-1.5 text-center text-xs font-medium text-red-600" role="alert">
                  {videoError}
                </p>
              ) : null}
            </div>
          </div>

          {saveError ? (
            <p className="px-5 pb-2 text-center text-xs font-medium text-red-600" role="alert">
              {saveError}
            </p>
          ) : null}

          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e1dbd3] px-5 py-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
              className="h-9 cursor-pointer rounded-md border border-[#e1dbd3] bg-white px-4 text-sm font-semibold text-nimbli-ink transition-colors duration-200 motion-reduce:transition-none hover:bg-nimbli-canvas/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 cursor-pointer rounded-md border border-transparent bg-nimbli px-4 text-sm font-bold text-nimbli-foreground shadow-[0_1px_0_0_var(--color-nimbli-shadow)] transition-colors duration-200 motion-reduce:transition-none hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Bezig…' : 'Opslaan'}
            </button>
          </footer>
        </form>

        <video ref={measureVideoRef} className="pointer-events-none fixed left-[-9999px] size-1 opacity-0" muted playsInline />
      </DialogContent>
    </Dialog>
  )
}
