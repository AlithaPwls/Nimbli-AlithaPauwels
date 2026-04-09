import { Check, Copy, Mail, MessageSquare, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { clearAddPatientDraft, readAddPatientDraft } from '@/lib/addPatientDraft'
import { useFinalizeAddPatient } from '@/hooks/kine/useFinalizeAddPatient'

function StepHeader() {
  return (
    <header className="max-w-5xl">
      <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-[#302d2d]">
        Nieuwe patiënt toevoegen
      </h1>
      <p className="mt-3 text-sm font-semibold text-nimbli-muted">Stap 4 van 4</p>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
      </div>
    </header>
  )
}

function ShareCard({ title, Icon, onClick }) {
  const IconComponent = Icon
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-[132px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-[#e5e7eb] bg-white shadow-[0_2px_0_0_#e1dbd3] transition-colors hover:border-nimbli/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
    >
      <div className="grid size-12 place-items-center rounded-2xl bg-nimbli text-white">
        <IconComponent className="size-6" aria-hidden />
      </div>
      <p className="font-nimbli-heading text-sm font-bold text-nimbli-ink">{title}</p>
    </button>
  )
}

export default function AddPatient4() {
  const navigate = useNavigate()
  const { finalize, loading: finalizing, error } = useFinalizeAddPatient()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const draft = readAddPatientDraft()
      if (!draft) return
      const res = await finalize(draft)
      if (cancelled) return
      if (res.ok && res.inviteCode) {
        setCode(res.inviteCode)
        clearAddPatientDraft()
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [finalize])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
      <StepHeader />

      <div className="mt-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full bg-nimbli text-white shadow-[0_4px_6px_0_rgba(0,0,0,0.1),0_2px_4px_0_rgba(0,0,0,0.1)]">
            <Check className="size-7" aria-hidden />
          </div>
          <div>
            <h2 className="font-nimbli-heading text-2xl font-bold text-nimbli-ink">Patiënt toegevoegd!</h2>
            <p className="text-sm font-semibold text-nimbli-muted">Deel de activatiecode met de ouder(s)</p>
          </div>
        </div>

        <section className="rounded-2xl border-2 border-[#e1dbd3] bg-white p-8 shadow-[0_2px_0_0_#e1dbd3]">
          <div className="text-center">
            <p className="font-nimbli-heading text-xl font-normal text-nimbli-ink">Activatiecode</p>
          </div>

          <div className="mt-6 rounded-2xl border border-nimbli bg-white p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-4">
                <Copy className="size-6 text-nimbli" aria-hidden />
                <p className="font-mono text-5xl font-bold tracking-[0.3em] text-nimbli">
                  {finalizing ? '••••••' : code || '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void copyCode()}
                disabled={finalizing || !code}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-nimbli px-6 font-nimbli-heading text-sm font-bold text-white shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:bg-nimbli/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
              >
                <Copy className="size-4" aria-hidden />
                {finalizing ? 'Bezig…' : copied ? 'Gekopieerd' : 'Kopieer code'}
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-nimbli-muted">
            Je kunt de activatiecode ook later terugvinden in het kinesisten dashboard
          </p>

          <div className="mt-7 border-t border-[#e5e7eb] pt-6">
            <p className="font-nimbli-heading text-lg font-normal text-nimbli-ink">Deel via:</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ShareCard title="QR-code" Icon={QrCode} onClick={() => {}} />
              <ShareCard title="Email" Icon={Mail} onClick={() => {}} />
              <ShareCard title="SMS" Icon={MessageSquare} onClick={() => {}} />
            </div>
          </div>
        </section>

        {error ? (
          <p className="text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border-2 border-[#ffb84d]/30 bg-[#fff7e8] p-8 shadow-[0_2px_0_0_#e1dbd3]">
          <h3 className="font-nimbli-heading text-lg font-extrabold text-nimbli-ink">Wat moeten ouders doen?</h3>
          <div className="mt-6 space-y-4 text-sm text-nimbli-ink">
            <div className="flex items-start gap-4">
              <div className="grid size-8 place-items-center rounded-full bg-[#ffb84d] font-nimbli-heading text-sm font-extrabold text-white">
                1
              </div>
              <p>
                Ga naar het <span className="font-extrabold">Nimbli-portaal</span>
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="grid size-8 place-items-center rounded-full bg-[#ffb84d] font-nimbli-heading text-sm font-extrabold text-white">
                2
              </div>
              <p>
                Open de app en kies <span className="font-extrabold">“Aanmelden met code”</span>
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="grid size-8 place-items-center rounded-full bg-[#ffb84d] font-nimbli-heading text-sm font-extrabold text-white">
                3
              </div>
              <p>Voer de activatiecode in</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={finalizing}
            className="h-11 bg-nimbli font-nimbli-heading font-black text-nimbli-foreground shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90"
            onClick={() => navigate('/dashboard/kine')}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

