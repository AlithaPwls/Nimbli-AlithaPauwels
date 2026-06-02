import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import NimbliDatePicker from '@/components/NimbliDatePicker.jsx'
import { Button } from '@/components/ui/button'
import { readAddPatientDraft, updateAddPatientDraft } from '@/lib/addPatientDraft'
import { useKineParentProfile } from '@/hooks/kine/useKineParentProfile.js'
import { useKineParentsSearch } from '@/hooks/kine/useKineParentsSearch.js'
import { cn } from '@/lib/utils'

function Field({
  label,
  placeholder,
  type = 'text',
  autoComplete,
  value,
  onChange,
  required = false,
  readOnly = false,
}) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-left">
      <span className="text-sm font-semibold text-nimbli-ink">
        {label}
        {required ? '*' : ''}
      </span>
      <input
        className={cn(
          'h-12 w-full rounded-lg border border-[#7c7c7c] px-3 text-sm text-nimbli-ink placeholder:text-[#7c7c7c] focus:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
          readOnly ? 'cursor-default bg-[#f9fafb]' : 'bg-white'
        )}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
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
  const [searchParams] = useSearchParams()

  const draft = readAddPatientDraft() ?? {}

  const [mode, setMode] = useState(draft.mode ?? 'new_family')
  const [existingParentId, setExistingParentId] = useState(draft.existingParentId ?? null)
  const [lockExistingParent, setLockExistingParent] = useState(Boolean(draft.lockExistingParent))
  const [parentSearch, setParentSearch] = useState('')
  const { parents: parentResults, loading: parentsLoading } = useKineParentsSearch(
    lockExistingParent ? '' : parentSearch
  )
  const { parent: linkedParent, loading: linkedParentLoading } =
    useKineParentProfile(existingParentId)

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

  useEffect(() => {
    const prefillParentId = searchParams.get('existingParentId')
    if (!prefillParentId) return

    setMode('existing_parent')
    setExistingParentId(prefillParentId)
    setLockExistingParent(true)
    setChildFirstname('')
    setChildLastname('')
    setChildDob('')
    setFocus('')

    const relationFromUrl = searchParams.get('parentRelation')?.trim()
    const patch = {
      mode: 'existing_parent',
      existingParentId: prefillParentId,
      lockExistingParent: true,
      childFirstname: '',
      childLastname: '',
      childDob: '',
      focus: '',
    }
    if (relationFromUrl) {
      setParentRelation(relationFromUrl)
      patch.parentRelation = relationFromUrl
    }
    persist(patch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (!linkedParent?.id) return

    const first = linkedParent.firstname ?? ''
    const last = linkedParent.lastname ?? ''
    const email = linkedParent.email ?? ''
    const phone = linkedParent.phone_number ?? ''

    setParentFirstname(first)
    setParentLastname(last)
    setParentEmail(email)
    setParentPhone(phone)

    persist({
      parentFirstname: first,
      parentLastname: last,
      parentEmail: email,
      parentPhone: phone,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedParent?.id, linkedParent?.firstname, linkedParent?.lastname, linkedParent?.email, linkedParent?.phone_number])

  function persist(next) {
    updateAddPatientDraft(next)
  }

  function selectMode(nextMode) {
    if (lockExistingParent && nextMode !== 'existing_parent') return
    setMode(nextMode)
    setError(null)
    persist({ mode: nextMode })
  }

  function handleNext() {
    setError(null)
    if (!childFirstname.trim() || !childLastname.trim()) {
      setError('Vul de voornaam en achternaam van de patiënt in.')
      return
    }
    if (mode === 'existing_parent') {
      if (!existingParentId) {
        setError('Zoek en selecteer een bestaande ouder.')
        return
      }
      persist({
        mode: 'existing_parent',
        existingParentId,
        lockExistingParent,
        childFirstname,
        childLastname,
        childDob,
        focus,
        parentRelation,
        parentFirstname,
        parentLastname,
        parentPhone,
        parentEmail,
      })
      navigate('/dashboard/kine/patienten/nieuw/2')
      return
    }
    if (!parentFirstname.trim() || !parentLastname.trim() || !parentEmail.trim()) {
      setError('Vul de gegevens van de ouder/voogd in (incl. e-mailadres).')
      return
    }
    persist({
      mode: 'new_family',
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
        {lockExistingParent ? (
          <SectionCard title="Type toevoeging">
            <p className="text-sm text-nimbli-muted">
              Je voegt een kind toe aan een bestaand gezin. De gegevens van de ouder/voogd zijn
              automatisch ingevuld.
            </p>
          </SectionCard>
        ) : (
          <SectionCard title="Type toevoeging">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => selectMode('new_family')}
                className={cn(
                  'rounded-lg border-2 px-4 py-2 font-nimbli-heading text-sm font-bold transition-colors',
                  mode === 'new_family'
                    ? 'border-nimbli bg-nimbli/10 text-nimbli'
                    : 'border-[#e1dbd3] bg-white text-nimbli-ink'
                )}
              >
                Nieuw gezin
              </button>
              <button
                type="button"
                onClick={() => selectMode('existing_parent')}
                className={cn(
                  'rounded-lg border-2 px-4 py-2 font-nimbli-heading text-sm font-bold transition-colors',
                  mode === 'existing_parent'
                    ? 'border-nimbli bg-nimbli/10 text-nimbli'
                    : 'border-[#e1dbd3] bg-white text-nimbli-ink'
                )}
              >
                Kind bij bestaande ouder
              </button>
            </div>
          </SectionCard>
        )}

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
            <NimbliDatePicker
              id="child-dob"
              label="Geboortedatum patiënt"
              required
              value={childDob}
              onChange={(iso) => {
                setError(null)
                setChildDob(iso)
                persist({ childDob: iso })
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
              required
            />
          </div>
        </SectionCard>

        {mode === 'existing_parent' ? (
          <SectionCard title="Ouder / voogd van dit gezin">
            {linkedParentLoading ? (
              <p className="text-sm text-nimbli-muted">Gegevens van de ouder laden…</p>
            ) : linkedParent ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field
                    label="Voornaam ouder/voogd"
                    placeholder="—"
                    value={parentFirstname}
                    readOnly
                  />
                  <Field
                    label="Achternaam ouder/voogd"
                    placeholder="—"
                    value={parentLastname}
                    readOnly
                  />
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <Field
                    label="Telefoonnummer ouder/voogd"
                    placeholder="—"
                    type="tel"
                    value={parentPhone}
                    readOnly
                  />
                  <Field
                    label="E-mailadres ouder/voogd"
                    placeholder="—"
                    type="email"
                    value={parentEmail}
                    readOnly
                  />
                </div>
              </>
            ) : (
              <>
                <Field
                  label="Zoek ouder (naam of e-mail)"
                  placeholder="Minimaal 2 tekens"
                  autoComplete="off"
                  value={parentSearch}
                  onChange={(e) => {
                    setError(null)
                    setParentSearch(e.target.value)
                  }}
                />
                {parentsLoading ? (
                  <p className="mt-3 text-sm text-nimbli-muted">Zoeken…</p>
                ) : null}
                <ul className="mt-3 flex flex-col gap-2">
                  {parentResults.map((p) => {
                    const name = `${p.firstname ?? ''} ${p.lastname ?? ''}`.trim()
                    const active = p.id === existingParentId
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setExistingParentId(p.id)
                            setError(null)
                            persist({ existingParentId: p.id })
                          }}
                          className={cn(
                            'w-full rounded-lg border px-3 py-2 text-left text-sm',
                            active
                              ? 'border-nimbli bg-nimbli/10 font-semibold text-nimbli'
                              : 'border-[#e1dbd3] bg-white hover:border-nimbli/40'
                          )}
                        >
                          <span className="font-nimbli-heading font-bold">{name || 'Ouder'}</span>
                          {p.email ? (
                            <span className="mt-0.5 block text-xs text-nimbli-muted">{p.email}</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
            <div className="mt-6">
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
            </div>
          </SectionCard>
        ) : (
        <SectionCard title="Gegevens contactpersonen">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Voornaam ouder/voogd"
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
              label="Achternaam ouder/voogd"
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
              label="Telefoonnummer ouder/voogd"
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
              label="Email adres ouder/voogd"
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
        )}
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

