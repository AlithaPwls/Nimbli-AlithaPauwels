import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChoosePasswordForm } from '@/hooks/useChoosePasswordForm'

function dutchGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Goedemorgen'
  if (h < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

export default function ChoosePassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parentName = searchParams.get('name') ?? 'Sofie Huismans'
  const childName = searchParams.get('child') ?? 'Liam De Broeck'

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
  }

  const inputClass =
    'h-12 w-full rounded-lg border border-nimbli-slot-border bg-white px-3 font-nimbli-body text-base font-medium text-nimbli-ink outline-none transition-colors duration-200 placeholder:text-nimbli-slot-border focus-visible:border-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/35 motion-reduce:transition-none'

  return (
    <div className="flex min-h-svh flex-col bg-nimbli-canvas font-nimbli-body text-nimbli-ink">
      <header className="shrink-0 px-4 pt-8 pb-4 sm:px-7 sm:pt-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md font-nimbli-heading text-lg font-bold text-nimbli-ink transition-colors duration-200 hover:text-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none motion-reduce:transition-none"
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
          Terug
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-12 pt-2 sm:px-6">
        <div className="w-full max-w-[520px]">
          <h1 className="text-center font-nimbli-heading text-[1.65rem] font-extrabold leading-tight text-black sm:text-4xl sm:leading-10">
            {dutchGreeting()}, {parentName}
          </h1>
          <p className="mt-5 text-center text-base leading-relaxed text-[#5d5d5d]">
            We hebben je code herkend. Je kinesist gebruikt nimbli om de oefeningen van{' '}
            {childName} op te volgen. Voer een wachtwoord in om later op je ouderaccount te
            kunnen inloggen.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex w-full max-w-[408px] flex-col gap-5"
            noValidate
          >
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

            <Button
              type="submit"
              className="mt-2 h-12 w-full cursor-pointer rounded-lg font-nimbli-heading text-base font-black text-white shadow-[0_4px_0_0_var(--color-nimbli-shadow)] transition-all duration-200 hover:brightness-105 active:translate-y-px active:shadow-none motion-reduce:transition-none bg-nimbli border-0"
            >
              Aanmelden
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
