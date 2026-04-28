import { Camera } from 'lucide-react'

export default function OuderAvatarPicker({
  valueUrl,
  fallbackText = 'K',
  onFileSelected,
  label = 'Profielfoto',
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="font-nimbli-heading text-sm font-bold text-[#1a1a1a]">{label}</p>
        <p className="mt-1 text-xs text-[#6b7280]">Upload een foto (frontend-only).</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="size-[72px] shrink-0 overflow-hidden rounded-2xl bg-nimbli-canvas ring-1 ring-nimbli-slot-border/20">
          {valueUrl ? (
            <img
              src={valueUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-nimbli-heading text-xl font-black text-nimbli">
              {fallbackText}
            </div>
          )}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-nimbli px-3 py-2 font-nimbli-heading text-xs font-black text-white shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:opacity-95 focus-within:ring-2 focus-within:ring-nimbli/40">
          <Camera className="size-4" aria-hidden />
          Kies foto
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileSelected?.(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>
    </div>
  )
}

