import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { readAddPatientDraft, updateAddPatientDraft } from '@/lib/addPatientDraft'

function Field({ label, placeholder, type = 'text', autoComplete, value, onChange, required = false }) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-left">
      <span className="text-sm font-semibold text-nimbli-ink">{label}</span>
      <input
        className="h-12 w-full rounded-lg border border-[#7c7c7c] bg-white px-3 text-sm text-nimbli-ink placeholder:text-[#7c7c7c] focus:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required={required}
      />
    </label>
  )
}

function StepHeader() {
  return (
    <header className="max-w-5xl">
      <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-[#302d2d]">
        Nieuwe patiënt toevoegen
      </h1>
      <p className="mt-3 text-sm font-semibold text-nimbli-muted">Stap 1 van 4</p>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="h-3 rounded-full bg-nimbli shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]" />
        <div className="h-3 rounded-full bg-white" />
        <div className="h-3 rounded-full bg-white" />
        <div className="h-3 rounded-full bg-white" />
      </div>
    </header>
  )
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border-2 border-[#e1dbd3] bg-white p-8 shadow-[0_2px_0_0_#e1dbd3]">
      <h2 className="font-nimbli-heading text-2xl font-bold text-nimbli-ink">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function AddPatient1() {
  const navigate = useNavigate()

  const draft = readAddPatientDraft() ?? {}

  const [childFirstname, setChildFirstname] = useState(draft.childFirstname ?? '')
  const [childLastname, setChildLastname] = useState(draft.childLastname ?? '')
  const [childDob, setChildDob] = useState(draft.childDob ?? '')
  const [focus, setFocus] = useState(draft.focus ?? '')

  const [parentFirstname, setParentFirstname] = useState(draft.parentFirstname ?? '')
  const [parentLastname, setParentLastname] = useState(draft.parentLastname ?? '')
  const [parentPhone, setParentPhone] = useState(draft.parentPhone ?? '')
  const [parentEmail, setParentEmail] = useState(draft.parentEmail ?? '')
  const [parentRelation, setParentRelation] = useState(draft.parentRelation ?? '')
  const [error, setError] = useState(null)

  function persist(next) {
    updateAddPatientDraft(next)
  }

  function handleNext() {
    setError(null)
    if (!childFirstname.trim() || !childLastname.trim()) {
      setError('Vul de voornaam en achternaam van de patiënt in.')
      return
    }
    if (!parentFirstname.trim() || !parentLastname.trim() || !parentEmail.trim()) {
      setError('Vul de gegevens van de ouder/voogd in (incl. e-mailadres).')
      return
    }
    persist({
      childFirstname,
      childLastname,
      childDob,
      focus,
      parentFirstname,
      parentLastname,
      parentPhone,
      parentEmail,
      parentRelation,
    })
    navigate('/dashboard/kine/patienten/nieuw/2')
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
      <StepHeader />

      <div className="mt-10 space-y-6">
        <SectionCard title="Basisgegevens">
          <div className="grid gap-6 md:grid-cols-3">
            <Field
              label="Voornaam patiënt"
              placeholder="Voornaam"
              autoComplete="given-name"
              value={childFirstname}
              onChange={(e) => {
                setError(null)
                setChildFirstname(e.target.value)
                persist({ childFirstname: e.target.value })
              }}
              required
            />
            <Field
              label="Achternaam patiënt"
              placeholder="Achternaam"
              autoComplete="family-name"
              value={childLastname}
              onChange={(e) => {
                setError(null)
                setChildLastname(e.target.value)
                persist({ childLastname: e.target.value })
              }}
              required
            />
            <Field
              label="Geboortedatum patiënt"
              placeholder="dd/mm/jjjj"
              type="date"
              autoComplete="bday"
              value={childDob}
              onChange={(e) => {
                setError(null)
                setChildDob(e.target.value)
                persist({ childDob: e.target.value })
              }}
            />
          </div>

          <div className="mt-6">
            <Field
              label="Behandeldoel"
              placeholder="Behandeldoel"
              autoComplete="off"
              value={focus}
              onChange={(e) => {
                setError(null)
                setFocus(e.target.value)
                persist({ focus: e.target.value })
              }}
            />
          </div>
        </SectionCard>

        <SectionCard title="Gegevens contactpersonen">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Voornaam ouder/voogd*"
              placeholder="Voornaam"
              autoComplete="given-name"
              value={parentFirstname}
              onChange={(e) => {
                setError(null)
                setParentFirstname(e.target.value)
                persist({ parentFirstname: e.target.value })
              }}
              required
            />
            <Field
              label="Achternaam ouder/voogd*"
              placeholder="Achternaam"
              autoComplete="family-name"
              value={parentLastname}
              onChange={(e) => {
                setError(null)
                setParentLastname(e.target.value)
                persist({ parentLastname: e.target.value })
              }}
              required
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Field
              label="Relatie met patiënt"
              placeholder="Bv. moeder"
              autoComplete="off"
              value={parentRelation}
              onChange={(e) => {
                setError(null)
                setParentRelation(e.target.value)
                persist({ parentRelation: e.target.value })
              }}
            />
            <Field
              label="Telefoonnummer ouder/voogd*"
              placeholder="Telefoonnummer"
              type="tel"
              autoComplete="tel"
              value={parentPhone}
              onChange={(e) => {
                setError(null)
                setParentPhone(e.target.value)
                persist({ parentPhone: e.target.value })
              }}
            />
            <Field
              label="Email adres ouder/voogd*"
              placeholder="Email adres"
              type="email"
              autoComplete="email"
              value={parentEmail}
              onChange={(e) => {
                setError(null)
                setParentEmail(e.target.value)
                persist({ parentEmail: e.target.value })
              }}
              required
            />
          </div>
        </SectionCard>
      </div>

      {error ? (
        <p className="mt-6 text-sm font-semibold text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="h-11 border-nimbli font-nimbli-heading font-black text-nimbli shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/5"
          onClick={() => navigate('/dashboard/kine')}
        >
          Annuleren
        </Button>

        <Button
          type="button"
          className="h-11 bg-nimbli font-nimbli-heading font-black text-nimbli-foreground shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 disabled:opacity-60"
          onClick={handleNext}
        >
          Volgende
          <ArrowRight className="ml-2 size-5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

