import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function OuderAvatarPicker({
  valueUrl,
  fallbackText = 'K',
  name = 'Kind',
  onFileSelected,
  onRemove,
  canRemove = false,
  saving = false,
  size = 'lg',
  className,
}) {
  const isLarge = size === 'lg'
  const avatarSize = isLarge ? 'size-28 sm:size-32' : 'size-[72px]'
  const fallbackTextSize = isLarge ? 'text-3xl sm:text-4xl' : 'text-xl'

  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-full bg-nimbli-canvas ring-2 ring-[#e1dbd3]',
          avatarSize
        )}
      >
        {valueUrl ? (
          <img
            src={valueUrl}
            alt={`Profielfoto van ${name}`}
            className="h-full w-full object-cover"
            decoding="async"
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center font-nimbli-heading font-black text-nimbli',
              fallbackTextSize
            )}
            aria-hidden
          >
            {fallbackText}
          </div>
        )}
        {saving ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75">
            <Loader2 className="size-7 animate-spin text-nimbli" aria-hidden />
            <span className="sr-only">Foto opslaan…</span>
          </div>
        ) : null}
      </div>

      <div className="flex w-full max-w-sm flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <label
          className={cn(
            'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-nimbli px-4 py-2.5',
            'font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a]',
            'transition-colors duration-200 hover:bg-nimbli/90 motion-reduce:transition-none',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-nimbli/40 focus-within:ring-offset-2',
            saving && 'pointer-events-none opacity-60'
          )}
        >
          {valueUrl ? (
            <Camera className="size-4 shrink-0" aria-hidden />
          ) : (
            <ImagePlus className="size-4 shrink-0" aria-hidden />
          )}
          {valueUrl ? 'Andere foto kiezen' : 'Foto uploaden'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={saving}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileSelected?.(file)
              e.target.value = ''
            }}
          />
        </label>

        {canRemove ? (
          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={() => onRemove?.()}
            className="min-h-11 gap-2 px-4 font-nimbli-heading text-sm font-black"
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            Verwijderen
          </Button>
        ) : null}
      </div>

      <p className="max-w-xs text-center text-xs leading-relaxed text-[#6b7280]">
        JPG, PNG of WebP, max. 5 MB. Wijzigingen worden direct opgeslagen.
      </p>
    </div>
  )
}
