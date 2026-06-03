import { Check, Copy, Mail, MessageSquare, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import KinePatientInviteDialog from '@/components/kine/KinePatientInviteDialog.jsx'
import { Button } from '@/components/ui/button'
import { clearAddPatientDraft, readAddPatientDraft } from '@/lib/addPatientDraft'
import { runFinalizeAddPatientOnce } from '@/lib/finalizeAddPatientOnce'
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

function ShareCard({ title, Icon, onClick, disabled = false }) {
  const IconComponent = Icon
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-[132px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-[#e5e7eb] bg-white shadow-[0_2px_0_0_#e1dbd3] transition-colors hover:border-nimbli/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 disabled:cursor-not-allowed disabled:opacity-50 max-lg:h-20 max-lg:gap-2 max-lg:rounded-xl max-lg:border max-lg:shadow-none"
    >
      <div className="grid size-12 place-items-center rounded-2xl bg-nimbli text-white max-lg:size-9 max-lg:rounded-lg">
        <IconComponent className="size-6 max-lg:size-4" aria-hidden />
      </div>
      <p className="font-nimbli-heading text-sm font-bold text-nimbli-ink max-lg:text-xs">{title}</p>
    </button>
  )
}

export default function AddPatient4() {
  const navigate = useNavigate()
  const { finalize, loading: finalizing, error } = useFinalizeAddPatient()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const draft = readAddPatientDraft()
      if (!draft) return
      const res = await runFinalizeAddPatientOnce(finalize, draft)
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
    <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink max-lg:px-4 max-lg:py-6">
      <StepHeader />

      <div className="mt-10 space-y-6 max-lg:mt-6 max-lg:space-y-4">
        <div className="flex items-center gap-4 max-lg:gap-3">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-nimbli text-white shadow-[0_4px_6px_0_rgba(0,0,0,0.1),0_2px_4px_0_rgba(0,0,0,0.1)] max-lg:size-10 max-lg:shadow-none">
            <Check className="size-7 max-lg:size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-nimbli-heading text-2xl font-bold text-nimbli-ink max-lg:text-lg">
              Patiënt toegevoegd!
            </h2>
            <p className="text-sm font-semibold text-nimbli-muted max-lg:text-xs">
              Deel de activatiecode met de ouder(s)
            </p>
          </div>
        </div>

        <section className="rounded-2xl border-2 border-[#e1dbd3] bg-white p-8 shadow-[0_2px_0_0_#e1dbd3] max-lg:rounded-xl max-lg:p-4 max-lg:shadow-none">
          <div className="text-center">
            <p className="font-nimbli-heading text-xl font-normal text-nimbli-ink max-lg:text-base">
              Activatiecode
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-nimbli bg-white p-8 max-lg:mt-4 max-lg:rounded-xl max-lg:p-4">
            <div className="flex flex-col items-center justify-center">
              <div className="flex max-w-full items-center justify-center gap-3 max-lg:gap-2">
                <Copy className="size-6 shrink-0 text-nimbli max-lg:size-4" aria-hidden />
                <p className="font-mono text-5xl font-bold tracking-[0.3em] text-nimbli max-lg:text-3xl max-lg:tracking-[0.15em] max-sm:text-2xl">
                  {finalizing ? '••••••' : code || '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void copyCode()}
                disabled={finalizing || !code}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-nimbli px-6 font-nimbli-heading text-sm font-bold text-white shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:bg-nimbli/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 max-lg:mt-4 max-lg:h-9 max-lg:px-4 max-lg:text-xs"
              >
                <Copy className="size-4 max-lg:size-3.5" aria-hidden />
                {finalizing ? 'Bezig…' : copied ? 'Gekopieerd' : 'Kopieer code'}
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-nimbli-muted max-lg:mt-3 max-lg:leading-snug">
            Je kunt de activatiecode ook later terugvinden in het kinesisten dashboard
          </p>

          <div className="mt-7 border-t border-[#e5e7eb] pt-6 max-lg:mt-5 max-lg:pt-4">
            <p className="font-nimbli-heading text-lg font-normal text-nimbli-ink max-lg:text-sm">
              Deel via:
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 max-lg:mt-3 md:grid-cols-3 md:gap-4">
              <ShareCard
                title="QR-code"
                Icon={QrCode}
                disabled={finalizing || !code}
                onClick={() => setShareOpen(true)}
              />
              <ShareCard title="Email" Icon={Mail} onClick={() => {}} />
              <ShareCard title="SMS" Icon={MessageSquare} onClick={() => {}} />
            </div>
          </div>
        </section>

        <KinePatientInviteDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          inviteCode={code}
        />

        {error ? (
          <p className="text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border-2 border-[#ffb84d]/30 bg-[#fff7e8] p-8 shadow-[0_2px_0_0_#e1dbd3] max-lg:rounded-xl max-lg:p-4 max-lg:shadow-none">
          <h3 className="font-nimbli-heading text-lg font-extrabold text-nimbli-ink max-lg:text-base">
            Wat moeten ouders doen?
          </h3>
          <div className="mt-6 space-y-4 text-sm text-nimbli-ink max-lg:mt-4 max-lg:space-y-3 max-lg:text-xs">
            <div className="flex items-start gap-4 max-lg:gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffb84d] font-nimbli-heading text-sm font-extrabold text-white max-lg:size-7 max-lg:text-xs">
                1
              </div>
              <p>
                Ga naar het <span className="font-extrabold">Nimbli-portaal</span>
              </p>
            </div>
            <div className="flex items-start gap-4 max-lg:gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffb84d] font-nimbli-heading text-sm font-extrabold text-white max-lg:size-7 max-lg:text-xs">
                2
              </div>
              <p>
                Open de app en kies <span className="font-extrabold">“Aanmelden met code”</span>
              </p>
            </div>
            <div className="flex items-start gap-4 max-lg:gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ffb84d] font-nimbli-heading text-sm font-extrabold text-white max-lg:size-7 max-lg:text-xs">
                3
              </div>
              <p>Voer de activatiecode in</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end max-lg:justify-center">
          <Button
            type="button"
            disabled={finalizing}
            className="h-11 w-full max-w-sm justify-center bg-nimbli font-nimbli-heading font-black text-nimbli-foreground shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 lg:w-auto lg:max-w-none"
            onClick={() => navigate('/dashboard/kine')}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

