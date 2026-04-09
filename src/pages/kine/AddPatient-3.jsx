import { ArrowLeft, ArrowRight, Mail, Phone, User } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { readAddPatientDraft } from '@/lib/addPatientDraft'

const ASSETS = {
  patientPhoto: 'https://www.figma.com/api/mcp/asset/9123c94e-5949-40f2-ad85-7eb04295e8e2',
  stretchNaarDeSterren: 'https://www.figma.com/api/mcp/asset/c7f45815-ed1a-4e61-9180-fdab4bb49b4f',
  superheldPose: 'https://www.figma.com/api/mcp/asset/0ac56bf7-9b21-44b4-b6aa-773e8aff2ab3',
}

function StepHeader() {
  return (
    <header className="max-w-5xl">
      <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-[#302d2d]">
        Nieuwe patiënt toevoegen
      </h1>
      <p className="mt-3 text-sm font-semibold text-nimbli-muted">Stap 3 van 4</p>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-white" />
      </div>
    </header>
  )
}

function BigCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border-2 border-[#e1dbd3] bg-white p-8 shadow-[0_2px_0_0_#e1dbd3]">
      <div>
        <h2 className="font-nimbli-heading text-2xl font-bold text-nimbli-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-nimbli-muted">{subtitle}</p> : null}
      </div>
      <div className="mt-7">{children}</div>
    </section>
  )
}

function SmallCard({ children, className = '' }) {
  return (
    <div
      className={[
        'rounded-2xl border-2 border-[#e1dbd3] bg-white p-6 shadow-[0_2px_0_0_#e1dbd3]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function Pill({ tone = 'yellow', children }) {
  const cls =
    tone === 'yellow'
      ? 'bg-[#FBB92A] text-[#302d2d]'
      : tone === 'green'
        ? 'bg-[#BDE786] text-[#302d2d]'
        : 'bg-nimbli/15 text-nimbli-ink'

  return <span className={['inline-flex h-5 items-center rounded-full px-2 text-xs', cls].join(' ')}>{children}</span>
}

function ExerciseRow({ title, tone, tag, difficulty, reps, time, imageUrl }) {
  return (
    <SmallCard className="p-6">
      <div className="flex items-start gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-nimbli-heading text-lg font-bold text-nimbli-ink">{title}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Pill tone={tone}>{tag}</Pill>
            <span className="text-nimbli-muted">•</span>
            <span className="text-xs text-nimbli-ink">{difficulty}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-nimbli-muted">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>↻</span>
              {reps}
            </span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>⏱</span>
              {time}
            </span>
          </div>
        </div>
      </div>
    </SmallCard>
  )
}

export default function AddPatient3() {
  const navigate = useNavigate()

  const draft = useMemo(() => readAddPatientDraft() ?? {}, [])
  const patientName = `${draft.childFirstname ?? ''} ${draft.childLastname ?? ''}`.trim() || 'Nieuwe patiënt'
  const birthdate = draft.childDob ? String(draft.childDob) : '—'
  const parentName = `${draft.parentFirstname ?? ''} ${draft.parentLastname ?? ''}`.trim() || 'Ouder/voogd'
  const parentEmail = draft.parentEmail || '—'
  const parentPhone = draft.parentPhone || '—'
  const parentRelation = draft.parentRelation || '—'
  const behandeldoel = draft.focus || '—'

  const selectedCount = Array.isArray(draft.selectedExerciseIds) ? draft.selectedExerciseIds.length : 0

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
      <StepHeader />

      <div className="mt-10 space-y-6">
        <BigCard title="Bijna klaar!" subtitle="Controleer of alle gegevens juist zijn.">
          <div className="grid gap-8 md:grid-cols-2">
            <SmallCard className="p-7">
              <div className="flex flex-col items-center gap-5">
                <div className="h-40 w-40 overflow-hidden rounded-2xl bg-nimbli-canvas">
                  <img
                    src={ASSETS.patientPhoto}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="text-center">
                  <p className="font-nimbli-heading text-2xl font-bold text-nimbli-ink">{patientName}</p>
                  <p className="mt-1 text-sm text-nimbli-muted">{birthdate}</p>
                </div>

                <div className="w-full">
                  <p className="text-sm text-nimbli-muted">Contactgegevens ouders</p>
                  <div className="mt-4 rounded-2xl border border-[#e1dbd3] bg-[#f9fafb] p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-xl bg-nimbli/10 text-nimbli">
                        <User className="size-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="font-nimbli-heading text-sm font-extrabold text-nimbli-ink">
                          {parentName}
                        </p>
                        <p className="text-xs text-nimbli-muted">{parentRelation}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-nimbli-muted">
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5" aria-hidden />
                        <span className="truncate">{parentEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5" aria-hidden />
                        <span>{parentPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SmallCard>

            <div className="space-y-6">
              <SmallCard className="p-7">
                <p className="text-sm text-nimbli-muted">Behandeldoel(en)</p>
                <p className="mt-3 font-nimbli-heading text-base font-extrabold text-nimbli-ink">
                  {behandeldoel}
                </p>
              </SmallCard>

              <div>
                <p className="font-nimbli-heading text-xl font-normal text-nimbli-ink">
                  Startprogramma ({selectedCount} oefeningen)
                </p>
                <div className="mt-4 space-y-4">
                  <ExerciseRow
                    title="Stretch naar de Sterren"
                    tone="yellow"
                    tag="Mobiliteit"
                    difficulty="Makkelijk"
                    reps="10x herhalingen"
                    time="2 min"
                    imageUrl={ASSETS.stretchNaarDeSterren}
                  />
                  <ExerciseRow
                    title="Superheld pose"
                    tone="green"
                    tag="Balans"
                    difficulty="Moeilijk"
                    reps="12x herhalingen"
                    time="2 min"
                    imageUrl={ASSETS.superheldPose}
                  />
                </div>
              </div>
            </div>
          </div>
        </BigCard>

        <div className="rounded-2xl border border-[#fbb92a]/40 bg-[#fef3e0] p-5 text-nimbli-ink">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#FBB92A] text-[#302d2d]">
              <span className="font-nimbli-heading text-base font-extrabold" aria-hidden>
                i
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-nimbli-heading text-base font-extrabold">Wat gebeurt er nu?</p>
              <p className="mt-1 text-sm text-nimbli-muted">
                Na het bevestigen van alle gegevens wordt automatisch een 6-cijferige activatiecode gegenereerd. Met
                deze code kunnen ouders het kinderprofiel veilig activeren in de app.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-nimbli font-nimbli-heading font-black text-nimbli shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/5"
            onClick={() => navigate('/dashboard/kine/patienten/nieuw/2')}
          >
            <ArrowLeft className="mr-2 size-5" aria-hidden />
            Vorige
          </Button>

          <Button
            type="button"
            className="h-11 bg-nimbli font-nimbli-heading font-black text-nimbli-foreground shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90"
            onClick={() => navigate('/dashboard/kine/patienten/nieuw/4')}
          >
            Opslaan
            <ArrowRight className="ml-2 size-5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

