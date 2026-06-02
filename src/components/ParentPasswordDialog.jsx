import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ParentPasswordDialog({
  open,
  onOpenChange,
  title,
  description,
  password,
  onPasswordChange,
  error,
  loading,
  canVerify,
  onSubmit,
  inputId = 'parent-password-gate',
}) {
  function handleSubmit(e) {
    e.preventDefault()
    if (loading || !canVerify) return
    onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 bg-kind-white sm:max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="font-nimbli-heading text-xl font-black tracking-tight text-kind-black">
              {title}
            </DialogTitle>
            <DialogDescription className="font-nimbli-body text-sm leading-relaxed text-kind-gray">
              {description}
            </DialogDescription>
          </DialogHeader>

          {!canVerify ? (
            <p className="rounded-xl border border-kind-border bg-kind-white px-3 py-2 font-nimbli-body text-sm text-kind-red shadow-[0px_2px_0px_#e1dbd3]">
              Geen gekoppeld ouderaccount gevonden.
            </p>
          ) : (
            <div className="grid gap-2">
              <label
                htmlFor={inputId}
                className="font-nimbli-body text-xs font-semibold tracking-wide text-kind-gray"
              >
                Wachtwoord ouderaccount
              </label>
              <input
                id={inputId}
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                className={cn(
                  'h-11 w-full rounded-xl border bg-kind-white px-3 font-nimbli-body text-sm text-kind-black outline-none',
                  'shadow-[0px_2px_0px_#e1dbd3] transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-kind-green-primary/40',
                  error ? 'border-kind-red' : 'border-kind-border'
                )}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {error ? (
                <p className="rounded-lg bg-kind-red/10 px-2 py-1 font-nimbli-body text-xs text-kind-red">
                  {error?.message ? String(error.message) : 'Wachtwoordcontrole mislukt.'}
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter className="mt-1 gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className={cn(
                'h-11 rounded-xl border border-kind-border bg-kind-white px-4 font-nimbli-heading text-sm font-bold text-kind-black',
                'shadow-[0px_2px_0px_#e1dbd3] transition-colors',
                'hover:bg-kind-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary/40',
                'disabled:opacity-60'
              )}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading || !canVerify}
              className={cn(
                'h-11 rounded-xl border-0 bg-kind-green-primary px-5 font-nimbli-heading text-sm font-black text-kind-canvas',
                'shadow-[0_4px_0_0_#1e7a6a] transition-colors hover:bg-kind-green-primary/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-white',
                'disabled:opacity-60 disabled:shadow-none'
              )}
            >
              {loading ? 'Bezig…' : 'Doorgaan'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
