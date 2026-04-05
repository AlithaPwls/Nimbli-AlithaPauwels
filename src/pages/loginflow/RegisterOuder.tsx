import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChoosePasswordForm } from '@/hooks/useChoosePasswordForm'
import { registerFamily } from '@/hooks/useRegisterFamily'
import type { ProfileRowRef, RegisterOuderLocationState } from '@/types/register-flow'

function dutchGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Goedemorgen'
  if (h < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function childDisplayName(p: ProfileRowRef) {
  return `${p.firstname} ${p.lastname}`.trim() || 'je kind'
}

export default function RegisterOuder() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as RegisterOuderLocationState | null

  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    password,
    setPassword,
    repeatPassword,
    setRepeatPassword,
    agreed,
    setAgreed,
    errors,
    validate,
  } = useChoosePasswordForm()

  useEffect(() => {
    if (!state?.inviteCode || !state.childProfile?.id || !state.parentProfile?.id) {
      navigate('/register', { replace: true })
    }
  }, [state, navigate])

  if (!state?.inviteCode || !state.childProfile?.id || !state.parentProfile?.id) {
    return null
  }

  const parentLabel =
    `${state.parentProfile.firstname} ${state.parentProfile.lastname}`.trim() || 'ouder'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return

    const em = email.trim()
    if (!em) {
      setFormError('Vul je e-mailadres in.')
      return
    }
    if (!firstname.trim() || !lastname.trim()) {
      setFormError('Vul je voor- en achternaam in.')
      return
    }

    setSubmitting(true)
    try {
      const result = await registerFamily({
        parentEmail: em,
        password,
        parentFirstname: firstname,
        parentLastname: lastname,
        inviteCode: state.inviteCode,
        childProfile: state.childProfile,
        parentProfile: state.parentProfile,
      })
      if (result.ok === true) {
        navigate('/dashboard/ouder', { replace: true })
      } else {
        setFormError(result.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'h-12 w-full rounded-lg border border-nimbli-slot-border bg-white px-3 font-nimbli-body text-base font-medium text-nimbli-ink outline-none transition-colors duration-200 placeholder:text-nimbli-slot-border focus-visible:border-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/35 motion-reduce:transition-none'

  return (
    <div className="flex min-h-svh flex-col bg-nimbli-canvas font-nimbli-body text-nimbli-ink">
      <header className="shrink-0 px-4 pt-8 pb-4 sm:px-7 sm:pt-12">
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md font-nimbli-heading text-lg font-bold text-nimbli-ink transition-colors duration-200 hover:text-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none motion-reduce:transition-none"
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
          Terug
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-12 pt-2 sm:px-6">
        <div className="w-full max-w-[520px]">
          <h1 className="text-center font-nimbli-heading text-[1.65rem] font-extrabold leading-tight text-black sm:text-4xl sm:leading-10">
            {dutchGreeting()}, {parentLabel}
          </h1>
          <p className="mt-5 text-center text-base leading-relaxed text-[#5d5d5d]">
            Je code klopt. Je kinesist gebruikt nimbli om de oefeningen van{' '}
            {childDisplayName(state.childProfile)} op te volgen. Vul je gegevens en een wachtwoord
            in om je ouderaccount te activeren.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex w-full max-w-[408px] flex-col gap-5"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-firstname" className="sr-only">
                Voornaam
              </label>
              <input
                id="reg-firstname"
                type="text"
                autoComplete="given-name"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="Voornaam"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-lastname" className="sr-only">
                Achternaam
              </label>
              <input
                id="reg-lastname"
                type="text"
                autoComplete="family-name"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="Achternaam"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-email" className="sr-only">
                E-mailadres
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mailadres"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="choose-password" className="sr-only">
                Wachtwoord
              </label>
              <input
                id="choose-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wachtwoord"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'err-password' : undefined}
                className={inputClass}
              />
              {errors.password ? (
                <p id="err-password" className="text-sm text-red-600" role="alert">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="choose-repeat" className="sr-only">
                Herhaal wachtwoord
              </label>
              <input
                id="choose-repeat"
                type="password"
                autoComplete="new-password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="Herhaal wachtwoord"
                aria-invalid={Boolean(errors.repeat)}
                aria-describedby={errors.repeat ? 'err-repeat' : undefined}
                className={inputClass}
              />
              {errors.repeat ? (
                <p id="err-repeat" className="text-sm text-red-600" role="alert">
                  {errors.repeat}
                </p>
              ) : null}
            </div>

            <label
              htmlFor="choose-terms"
              className="flex cursor-pointer items-start gap-2.5 rounded-md py-1.5"
            >
              <input
                id="choose-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer sr-only"
                aria-invalid={Boolean(errors.terms)}
                aria-describedby={errors.terms ? 'err-terms' : undefined}
              />
              <span
                className="mt-0.5 flex size-[19px] shrink-0 items-center justify-center rounded border border-nimbli-slot-border bg-white transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-nimbli/40 peer-checked:border-nimbli peer-checked:bg-nimbli peer-checked:[&_svg]:opacity-100 motion-reduce:transition-none"
                aria-hidden
              >
                <Check className="size-3 text-white opacity-0" strokeWidth={3} />
              </span>
              <span className="pt-px text-[0.65rem] leading-snug text-nimbli-ink sm:text-xs">
                Ik ga akkoord met de{' '}
                <Link
                  to="#"
                  className="font-nimbli-heading font-semibold text-nimbli underline underline-offset-2 transition-colors hover:text-nimbli-ink focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none"
                >
                  voorwaarden
                </Link>
                .
              </span>
            </label>
            {errors.terms ? (
              <p id="err-terms" className="-mt-2 text-sm text-red-600" role="alert">
                {errors.terms}
              </p>
            ) : null}

            {formError ? (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={submitting}
              className="mt-2 h-12 w-full cursor-pointer rounded-lg font-nimbli-heading text-base font-black text-white shadow-[0_4px_0_0_var(--color-nimbli-shadow)] transition-all duration-200 hover:brightness-105 active:translate-y-px active:shadow-none motion-reduce:transition-none bg-nimbli border-0 disabled:opacity-60"
            >
              {submitting ? 'Bezig…' : 'Aanmelden'}
            </Button>
          </form>
        </div>
      </main>

      <footer className="mt-auto flex shrink-0 flex-wrap items-center justify-center gap-7 px-4 py-8 text-xs font-nimbli-heading font-normal text-nimbli-ink/80 sm:text-sm">
        <Link
          to="#"
          className="cursor-pointer transition-colors duration-200 hover:text-nimbli-ink focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none motion-reduce:transition-none"
        >
          Privacy
        </Link>
        <Link
          to="#"
          className="cursor-pointer transition-colors duration-200 hover:text-nimbli-ink focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none motion-reduce:transition-none"
        >
          Gebruiksvoorwaarden
        </Link>
      </footer>
    </div>
  )
}
