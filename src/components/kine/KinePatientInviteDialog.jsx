import { useState } from 'react'
import { Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInviteQrDataUrl } from '@/hooks/useInviteQrDataUrl.js'
import { formatInviteCodeDisplay, normalizeInviteCodeDigits } from '@/lib/inviteRegisterLink.js'

export default function KinePatientInviteDialog({ open, onOpenChange, inviteCode }) {
  const [copied, setCopied] = useState(false)
  const displayCode = formatInviteCodeDisplay(inviteCode)
  const rawCode = normalizeInviteCodeDigits(inviteCode)
  const { dataUrl: qrDataUrl, registerUrl, error: qrError } = useInviteQrDataUrl(
    inviteCode,
    open && rawCode.length === 6
  )

  async function copyCode() {
    if (!rawCode) return
    try {
      await navigator.clipboard.writeText(rawCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-nimbli-heading text-xl font-bold text-nimbli-ink">
            Activatiecode
          </DialogTitle>
          <DialogDescription className="text-sm text-nimbli-muted">
            Deel de code of laat de ouder de QR-code scannen met de telefooncamera.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-nimbli bg-white p-6 text-center">
          <p className="font-mono text-4xl font-bold tracking-[0.2em] text-nimbli">{displayCode}</p>
          <button
            type="button"
            onClick={() => void copyCode()}
            disabled={!rawCode}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-nimbli px-6 font-nimbli-heading text-sm font-bold text-white shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:bg-nimbli/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 disabled:opacity-50"
          >
            <Copy className="size-4" aria-hidden />
            {copied ? 'Gekopieerd' : 'Kopieer code'}
          </button>
        </div>

        {rawCode.length === 6 ? (
          <div className="rounded-2xl border border-[#e1dbd3] bg-nimbli-canvas/40 p-5 text-center">
            <p className="font-nimbli-heading text-sm font-bold text-nimbli-ink">QR-code voor ouders</p>
            <p className="mt-1 text-xs text-nimbli-muted">
              Scan opent de registratiepagina met de code al ingevuld.
            </p>
            <div className="mx-auto mt-4 flex size-[200px] items-center justify-center rounded-xl border border-[#e1dbd3] bg-white p-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR-code om te registreren met code ${displayCode}`}
                  className="size-full object-contain"
                  width={200}
                  height={200}
                />
              ) : qrError ? (
                <p className="px-2 text-xs text-red-600" role="alert">
                  {qrError}
                </p>
              ) : (
                <p className="text-xs text-nimbli-muted">QR-code laden…</p>
              )}
            </div>
            {registerUrl ? (
              <p className="mt-3 break-all text-[10px] text-nimbli-muted">{registerUrl}</p>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
