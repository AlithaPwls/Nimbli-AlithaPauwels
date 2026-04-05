import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Check, CreditCard, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth.js'
import { useKinePracticeRegistration } from '@/hooks/useKinePracticeRegistration'
import {
  initialKinePracticeForm,
  type KinePracticeRegistrationState,
  type PracticePlanDb,
} from '@/types/practice-registration'

const inputClass =
  'h-12 w-full rounded-lg border border-nimbli-slot-border bg-white px-3 font-nimbli-body text-base font-medium text-nimbli-ink outline-none transition-colors duration-200 placeholder:text-nimbli-slot-border focus-visible:border-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/35 motion-reduce:transition-none'

type StepKey = 'plan' | 'practice' | 'payment' | 'account'

const ROLE_PATH: Record<string, string> = {
  child: '/dashboard/kind',
  parent: '/dashboard/ouder',
  kine: '/dashboard/kine',
}

function stepLabel(key: StepKey): string {
  switch (key) {
    case 'plan':
      return 'Kies je plan'
    case 'practice':
      return 'Praktijkgegevens'
    case 'payment':
      return 'Betaling (demo)'
    case 'account':
      return 'Jouw account'
    default:
      return ''
  }
}

function validateStep(
  key: StepKey,
  form: KinePracticeRegistrationState,
  skipAccount: boolean
): string | null {
  if (key === 'plan') return null
  if (key === 'practice') {
    if (!form.name.trim()) return 'Vul de naam van je praktijk in.'
    if (
      form.plan === 'pro' &&
      !form.invoice_same_as_practice &&
      !form.invoice_name.trim()
    ) {
      return 'Vul de factuurnaam in of vink aan dat factuur = praktijk.'
    }
    return null
  }
  if (key === 'payment') {
    if (form.plan !== 'pro') return null
    if (!form.simulatedPaymentConfirmed) return 'Bevestig de demo-betaling.'
    return null
  }
  if (key === 'account' && !skipAccount) {
    if (!form.kineFirstname.trim() || !form.kineLastname.trim()) {
      return 'Vul je voor- en achternaam in.'
    }
    if (!form.kineEmail.trim()) return 'Vul je e-mailadres in.'
    if (form.kinePassword.length < 8) return 'Wachtwoord minstens 8 tekens.'
    if (form.kinePassword !== form.kineRepeatPassword) {
      return 'Wachtwoorden komen niet overeen.'
    }
    if (!form.termsAccepted) return 'Ga akkoord met de voorwaarden.'
    return null
  }
  return null
}

function buildSteps(plan: PracticePlanDb, skipAccount: boolean): StepKey[] {
  const s: StepKey[] = ['plan', 'practice']
  if (plan === 'pro') s.push('payment')
  if (!skipAccount) s.push('account')
  return s
}

export default function RegisterKinePractice() {
  const navigate = useNavigate()
  const { user, role, profile, loading: authLoading, refreshProfile } = useAuth()
  const { submit, submitting } = useKinePracticeRegistration()

  const [form, setForm] = useState<KinePracticeRegistrationState>(initialKinePracticeForm)
  const [stepIndex, setStepIndex] = useState(0)
  const [stepError, setStepError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const skipAccount = Boolean(user && role === 'kine')
  const steps = useMemo(() => buildSteps(form.plan, skipAccount), [form.plan, skipAccount])
  const currentKey = steps[stepIndex] ?? 'plan'
  const totalSteps = steps.length
  const isLastStep = stepIndex >= totalSteps - 1

  useEffect(() => {
    if (authLoading) return
    if (user && role && ROLE_PATH[role]) {
      if (role === 'kine' && profile?.practice_id) {
        navigate('/dashboard/kine', { replace: true })
        return
      }
      if (role !== 'kine') {
        navigate(ROLE_PATH[role], { replace: true })
      }
    }
  }, [authLoading, user, role, profile, navigate])

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1))
    }
  }, [steps.length, stepIndex])

  const update = useCallback(
    <K extends keyof KinePracticeRegistrationState>(key: K, value: KinePracticeRegistrationState[K]) => {
      setForm((f) => {
        const next = { ...f, [key]: value }
        if (key === 'plan' && value === 'free') {
          next.simulatedPaymentConfirmed = false
          next.email_invoice = ''
          next.kvk_number = ''
          next.vat_number = ''
          next.invoice_same_as_practice = true
          next.invoice_name = ''
          next.invoice_street = ''
          next.invoice_street_number = ''
          next.invoice_city = ''
          next.invoice_postal_code = ''
          next.invoice_country = ''
        }
        return next
      })
      setStepError(null)
      setFormError(null)
    },
    []
  )

  function goNext() {
    const err = validateStep(currentKey, form, skipAccount)
    if (err) {
      setStepError(err)
      return
    }
    setStepError(null)
    if (isLastStep) {
      void handleFinalSubmit()
      return
    }
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1))
  }

  function goBack() {
    setStepError(null)
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1)
      return
    }
    navigate('/login')
  }

  async function handleFinalSubmit() {
    setFormError(null)
    const err = validateStep(currentKey, form, skipAccount)
    if (err) {
      setStepError(err)
      return
    }
    const mode = skipAccount ? 'existing_session' : 'new_kine'
    const result = await submit(form, mode, user?.id ?? null)
    if (result.ok === true) {
      await refreshProfile()
      navigate('/dashboard/kine', { replace: true })
    } else {
      setFormError(result.message)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    goNext()
  }

  if (authLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-nimbli-canvas font-nimbli-body text-nimbli-muted">
        Laden…
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-nimbli-canvas font-nimbli-body text-nimbli-ink">
      <header className="shrink-0 px-4 pt-8 pb-4 sm:px-7 sm:pt-12">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md font-nimbli-heading text-lg font-bold text-nimbli-ink transition-colors duration-200 hover:text-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none motion-reduce:transition-none"
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
          {stepIndex === 0 ? 'Terug naar login' : 'Vorige stap'}
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-12 pt-2 sm:px-6">
        <div className="w-full max-w-[520px]">
          <p className="text-center text-sm font-nimbli-heading font-semibold text-nimbli-muted">
            Stap {stepIndex + 1} van {totalSteps}
          </p>
          <div
            className="mx-auto mt-4 flex justify-center gap-2"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`Stap ${stepIndex + 1} van ${totalSteps}`}
          >
            {steps.map((_, i) => (
              <span
                key={i}
                className={`size-2.5 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                  i <= stepIndex ? 'bg-nimbli' : 'bg-nimbli-slot-border/60'
                }`}
              />
            ))}
          </div>

          <h1 className="mt-8 text-center font-nimbli-heading text-[1.65rem] font-extrabold leading-tight text-black sm:text-3xl sm:leading-10">
            {stepLabel(currentKey)}
          </h1>
          <p className="mt-3 text-center text-base leading-relaxed text-[#5d5d5d]">
            Registreer je praktijk op nimbli. Alle velden sluiten aan op je dossier; betaling is in
            deze versie enkel een demo.
          </p>

          <form
            onSubmit={onSubmit}
            className="mx-auto mt-8 flex w-full max-w-[440px] flex-col gap-5"
            noValidate
          >
            {currentKey === 'plan' ? (
              <div className="flex flex-col gap-4">
                <p className="text-center text-sm text-nimbli-muted">
                  Kies wat nu bij je past. Je kunt later upgraden.
                </p>
                <button
                  type="button"
                  onClick={() => update('plan', 'free')}
                  aria-pressed={form.plan === 'free'}
                  className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-nimbli/40 ${
                    form.plan === 'free'
                      ? 'border-nimbli bg-white shadow-[0_2px_0_0_var(--color-nimbli-shadow)]'
                      : 'border-nimbli-slot-border bg-white hover:border-nimbli/50'
                  }`}
                >
                  <span className="flex items-center gap-2 font-nimbli-heading text-lg font-bold text-nimbli-ink">
                    <Building2 className="size-5 text-nimbli" aria-hidden />
                    Gratis
                  </span>
                  <span className="text-sm text-[#5d5d5d]">
                    Tot 3 patiënten per praktijk. Geen betaling in de app.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => update('plan', 'pro')}
                  aria-pressed={form.plan === 'pro'}
                  className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-nimbli/40 ${
                    form.plan === 'pro'
                      ? 'border-nimbli bg-white shadow-[0_2px_0_0_var(--color-nimbli-shadow)]'
                      : 'border-nimbli-slot-border bg-white hover:border-nimbli/50'
                  }`}
                >
                  <span className="flex items-center gap-2 font-nimbli-heading text-lg font-bold text-nimbli-ink">
                    <Sparkles className="size-5 text-nimbli" aria-hidden />
                    Premium
                  </span>
                  <span className="text-sm text-[#5d5d5d]">
                    Meer patiënten. Een korte demo-betaling in de app (geen echte afschrijving).
                  </span>
                </button>
              </div>
            ) : null}

            {currentKey === 'practice' ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="kp-name" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                    Praktijknaam *
                  </label>
                  <input
                    id="kp-name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className={inputClass}
                    autoComplete="organization"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="kp-phone" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                    Telefoon
                  </label>
                  <input
                    id="kp-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className={inputClass}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="kp-email-gen" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                    E-mail
                  </label>
                  <input
                    id="kp-email-gen"
                    type="email"
                    value={form.email_general}
                    onChange={(e) => update('email_general', e.target.value)}
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>
                {form.plan === 'pro' ? (
                  <>
                    <div>
                      <label htmlFor="kp-email-inv" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                        Facturatie-e-mail
                      </label>
                      <input
                        id="kp-email-inv"
                        type="email"
                        value={form.email_invoice}
                        onChange={(e) => update('email_invoice', e.target.value)}
                        className={inputClass}
                        autoComplete="email"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="kp-kvk" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                          KVK-nummer
                        </label>
                        <input
                          id="kp-kvk"
                          value={form.kvk_number}
                          onChange={(e) => update('kvk_number', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="kp-vat" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                          BTW-nummer
                        </label>
                        <input
                          id="kp-vat"
                          value={form.vat_number}
                          onChange={(e) => update('vat_number', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </>
                ) : null}
                <p className="font-nimbli-heading text-sm font-bold text-nimbli-ink">Adres praktijk</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="kp-street" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                      Straat
                    </label>
                    <input
                      id="kp-street"
                      value={form.street}
                      onChange={(e) => update('street', e.target.value)}
                      className={inputClass}
                      autoComplete="street-address"
                    />
                  </div>
                  <div>
                    <label htmlFor="kp-num" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                      Nr.
                    </label>
                    <input
                      id="kp-num"
                      value={form.street_number}
                      onChange={(e) => update('street_number', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="kp-postal" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                      Postcode
                    </label>
                    <input
                      id="kp-postal"
                      value={form.postal_code}
                      onChange={(e) => update('postal_code', e.target.value)}
                      className={inputClass}
                      autoComplete="postal-code"
                    />
                  </div>
                  <div>
                    <label htmlFor="kp-city" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                      Gemeente
                    </label>
                    <input
                      id="kp-city"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      className={inputClass}
                      autoComplete="address-level2"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="kp-country" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                    Land
                  </label>
                  <input
                    id="kp-country"
                    value={form.country}
                    onChange={(e) => update('country', e.target.value)}
                    className={inputClass}
                    autoComplete="country-name"
                  />
                </div>

                {form.plan === 'pro' ? (
                  <>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent py-1">
                      <input
                        type="checkbox"
                        checked={form.invoice_same_as_practice}
                        onChange={(e) => update('invoice_same_as_practice', e.target.checked)}
                        className="mt-1 size-4 shrink-0 cursor-pointer rounded border-nimbli-slot-border text-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/40"
                      />
                      <span className="text-sm text-nimbli-ink">
                        Factuuradres is hetzelfde als praktijkadres
                      </span>
                    </label>

                    {!form.invoice_same_as_practice ? (
                      <div className="flex flex-col gap-4 rounded-xl border border-nimbli-slot-border bg-white/80 p-4">
                        <p className="font-nimbli-heading text-sm font-bold text-nimbli-ink">Factuuradres</p>
                        <div>
                          <label htmlFor="kp-inv-name" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                            Naam op factuur *
                          </label>
                          <input
                            id="kp-inv-name"
                            value={form.invoice_name}
                            onChange={(e) => update('invoice_name', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div className="sm:col-span-2">
                            <label htmlFor="kp-inv-street" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                              Straat
                            </label>
                            <input
                              id="kp-inv-street"
                              value={form.invoice_street}
                              onChange={(e) => update('invoice_street', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label htmlFor="kp-inv-num" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                              Nr.
                            </label>
                            <input
                              id="kp-inv-num"
                              value={form.invoice_street_number}
                              onChange={(e) => update('invoice_street_number', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="kp-inv-postal" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                              Postcode
                            </label>
                            <input
                              id="kp-inv-postal"
                              value={form.invoice_postal_code}
                              onChange={(e) => update('invoice_postal_code', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label htmlFor="kp-inv-city" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                              Gemeente
                            </label>
                            <input
                              id="kp-inv-city"
                              value={form.invoice_city}
                              onChange={(e) => update('invoice_city', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="kp-inv-country" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                            Land
                          </label>
                          <input
                            id="kp-inv-country"
                            value={form.invoice_country}
                            onChange={(e) => update('invoice_country', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}

            {currentKey === 'payment' ? (
              <div className="flex flex-col gap-4 rounded-xl border border-nimbli-slot-border bg-white p-4">
                <div className="flex items-center gap-2 font-nimbli-heading text-nimbli-ink">
                  <CreditCard className="size-5 text-nimbli" aria-hidden />
                  <span className="font-bold">Demo-betaling</span>
                </div>
                <p className="text-sm text-[#5d5d5d]">
                  Dit is een simulatie: er wordt niets afgeschreven en er worden geen kaartgegevens
                  opgeslagen.
                </p>
                <div>
                  <label htmlFor="kp-card-name" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                    Naam kaarthouder
                  </label>
                  <input
                    id="kp-card-name"
                    className={inputClass}
                    placeholder="Zoals op de kaart"
                    autoComplete="cc-name"
                  />
                </div>
                <div>
                  <label htmlFor="kp-card-num" className="mb-1 block text-sm font-semibold text-nimbli-ink">
                    Kaartnummer (demo)
                  </label>
                  <input
                    id="kp-card-num"
                    className={inputClass}
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.simulatedPaymentConfirmed}
                    onChange={(e) => update('simulatedPaymentConfirmed', e.target.checked)}
                    className="mt-1 size-4 shrink-0 cursor-pointer rounded border-nimbli-slot-border text-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/40"
                  />
                  <span className="text-sm text-nimbli-ink">
                    Ik bevestig deze demo-betaling en begrijp dat dit geen echte betaling is.
                  </span>
                </label>
              </div>
            ) : null}

            {currentKey === 'account' && !skipAccount ? (
              <div className="flex flex-col gap-4">
                <input
                  value={form.kineFirstname}
                  onChange={(e) => update('kineFirstname', e.target.value)}
                  className={inputClass}
                  placeholder="Voornaam"
                  autoComplete="given-name"
                  aria-label="Voornaam"
                />
                <input
                  value={form.kineLastname}
                  onChange={(e) => update('kineLastname', e.target.value)}
                  className={inputClass}
                  placeholder="Achternaam"
                  autoComplete="family-name"
                  aria-label="Achternaam"
                />
                <input
                  type="email"
                  value={form.kineEmail}
                  onChange={(e) => update('kineEmail', e.target.value)}
                  className={inputClass}
                  placeholder="E-mailadres"
                  autoComplete="email"
                  aria-label="E-mailadres"
                />
                <input
                  type="password"
                  value={form.kinePassword}
                  onChange={(e) => update('kinePassword', e.target.value)}
                  className={inputClass}
                  placeholder="Wachtwoord"
                  autoComplete="new-password"
                  aria-label="Wachtwoord"
                />
                <input
                  type="password"
                  value={form.kineRepeatPassword}
                  onChange={(e) => update('kineRepeatPassword', e.target.value)}
                  className={inputClass}
                  placeholder="Herhaal wachtwoord"
                  autoComplete="new-password"
                  aria-label="Herhaal wachtwoord"
                />
                <label className="flex cursor-pointer items-start gap-2.5 py-1">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={(e) => update('termsAccepted', e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className="mt-0.5 flex size-[19px] shrink-0 items-center justify-center rounded border border-nimbli-slot-border bg-white transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-nimbli/40 peer-checked:border-nimbli peer-checked:bg-nimbli peer-checked:[&_svg]:opacity-100 motion-reduce:transition-none"
                    aria-hidden
                  >
                    <Check className="size-3 text-white opacity-0" strokeWidth={3} />
                  </span>
                  <span className="pt-px text-xs leading-snug text-nimbli-ink sm:text-sm">
                    Ik ga akkoord met de{' '}
                    <Link
                      to="#"
                      className="font-nimbli-heading font-semibold text-nimbli underline underline-offset-2"
                    >
                      voorwaarden
                    </Link>
                    .
                  </span>
                </label>
              </div>
            ) : null}

            {stepError ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {stepError}
              </p>
            ) : null}
            {formError ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full cursor-pointer rounded-lg font-nimbli-heading text-base font-black text-white shadow-[0_4px_0_0_var(--color-nimbli-shadow)] transition-all duration-200 hover:brightness-105 active:translate-y-px active:shadow-none motion-reduce:transition-none bg-nimbli border-0 disabled:opacity-60"
            >
              {submitting
                ? 'Bezig…'
                : isLastStep
                  ? skipAccount
                    ? 'Praktijk opslaan'
                    : 'Account aanmaken'
                  : 'Volgende'}
            </Button>
          </form>
        </div>
      </main>

      <footer className="mt-auto flex shrink-0 flex-wrap items-center justify-center gap-7 px-4 py-8 text-xs font-nimbli-heading text-nimbli-ink/80 sm:text-sm">
        <Link
          to="#"
          className="cursor-pointer transition-colors duration-200 hover:text-nimbli-ink focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none"
        >
          Privacy
        </Link>
        <Link
          to="#"
          className="cursor-pointer transition-colors duration-200 hover:text-nimbli-ink focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none"
        >
          Gebruiksvoorwaarden
        </Link>
      </footer>
    </div>
  )
}
