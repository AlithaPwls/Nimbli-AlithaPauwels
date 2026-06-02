import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfirmParentPassword } from '@/hooks/useConfirmParentPassword.js'
import { registerPendingChild } from '@/hooks/useRegisterPendingChild.js'
import supabase from '@/lib/supabaseClient.js'
import { buildChildSearch } from '@/lib/activeChild.js'

function childDisplayName(p) {
  return `${p?.firstname ?? ''} ${p?.lastname ?? ''}`.trim() || 'je kind'
}

export default function RegisterKind() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state ?? null

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [parentEmail, setParentEmail] = useState('')

  const { password, setPassword, error: passwordError, validate: validatePassword } =
    useConfirmParentPassword()
  const [agreed, setAgreed] = useState(false)
  const [termsError, setTermsError] = useState(null)

  useEffect(() => {
    if (!state?.childProfile?.id) {
      navigate('/register', { replace: true })
    }
  }, [state, navigate])

  useEffect(() => {
    let cancelled = false
    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      const session = data?.session
      if (session?.user?.id) {
        navigate(
          `/dashboard/ouder/kind-activeren${buildChildSearch(state?.childProfile?.id)}`,
          { replace: true, state }
        )
      }
    }
    void loadSession()
    return () => {
      cancelled = true
    }
  }, [navigate, state])

  if (!state?.childProfile?.id) {
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setTermsError(null)
    if (!validatePassword()) return
    if (!agreed) {
      setTermsError('Ga akkoord met de voorwaarden om verder te gaan.')
      return
    }

    const em = parentEmail.trim()
    if (!em) {
      setFormError('Vul het e-mailadres van je ouderaccount in.')
      return
    }

    setSubmitting(true)
    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: em,
        password,
      })
      if (signInErr || !signInData.user?.id) {
        setFormError('Inloggen mislukt. Controleer je e-mail en wachtwoord.')
        return
      }

      const result = await registerPendingChild({
        childProfileId: state.childProfile.id,
        parentAuthUserId: signInData.user.id,
        parentEmail: em,
        password,
      })

      if (!result.ok) {
        setFormError(result.message)
        return
      }

      navigate(`/dashboard/ouder${buildChildSearch(state.childProfile.id)}`, { replace: true })
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
          className="inline-flex cursor-pointer items-center gap-2 rounded-md font-nimbli-heading text-lg font-bold text-nimbli-ink"
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
          Terug
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 pb-12 pt-2 sm:px-6">
        <div className="w-full max-w-[520px]">
          <h1 className="text-center font-nimbli-heading text-[1.65rem] font-extrabold leading-tight text-black sm:text-4xl">
            Activeer {childDisplayName(state.childProfile)}
          </h1>
          <p className="mt-5 text-center text-base leading-relaxed text-[#5d5d5d]">
            Log in met je bestaande ouderaccount. Je ouderwachtwoord wordt gebruikt om dit kind te
            activeren — je kiest hier geen nieuw wachtwoord.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex w-full max-w-[408px] flex-col gap-5"
            noValidate
          >
            <input
              type="email"
              autoComplete="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="E-mailadres ouderaccount"
              className={inputClass}
              required
            />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ouderwachtwoord"
              className={inputClass}
            />
            {passwordError ? (
              <p className="text-sm text-red-600" role="alert">
                {passwordError}
              </p>
            ) : null}
            <label className="flex items-start gap-3 text-sm text-[#5d5d5d]">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 size-4 rounded border-nimbli-slot-border"
              />
              <span>Ik ga akkoord met de gebruiksvoorwaarden en privacyverklaring.</span>
            </label>
            {termsError ? (
              <p className="text-sm text-red-600" role="alert">
                {termsError}
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
              className="h-12 w-full bg-nimbli font-nimbli-heading text-lg font-black"
            >
              {submitting ? 'Bezig…' : 'Kind activeren'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-nimbli-muted">
            Al ingelogd?{' '}
            <Link to="/login" className="font-semibold text-nimbli underline">
              Ga naar inloggen
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
