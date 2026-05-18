import { useState } from 'react'
import { Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatInviteCode(code) {
  const digits = String(code ?? '').replace(/\D/g, '')
  if (digits.length !== 6) return digits || '—'
  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}

export default function KinePatientInviteDialog({ open, onOpenChange, inviteCode }) {
  const [copied, setCopied] = useState(false)
  const displayCode = formatInviteCode(inviteCode)
  const rawCode = String(inviteCode ?? '').replace(/\D/g, '')

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
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-nimbli-heading text-xl font-bold text-nimbli-ink">
            Activatiecode
          </DialogTitle>
          <DialogDescription className="text-sm text-nimbli-muted">
            Deel deze code met de ouder zodat ze zich kunnen registreren.
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
      </DialogContent>
    </Dialog>
  )
}
