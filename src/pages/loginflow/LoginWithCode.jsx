import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useActivationCode } from '@/hooks/useActivationCode'
import supabase from '@/lib/supabaseClient.js'

const SLOT_COUNT = 6

function CodeSlots({ digits, setRef, onChange, onKeyDown, onPaste }) {
  const group = (start, len) =>
    Array.from({ length: len }, (_, i) => {
      const idx = start + i
      return (
        <input
          key={idx}
          ref={setRef(idx)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digits[idx]}
          onChange={onChange(idx)}
          onKeyDown={onKeyDown(idx)}
          onPaste={idx === 0 ? onPaste : undefined}
          aria-label={`Cijfer ${idx + 1} van ${SLOT_COUNT}`}
          className="size-[54px] min-h-11 min-w-11 rounded-[10px] border-2 border-nimbli-slot-border bg-white text-center font-nimbli-heading text-2xl font-extrabold text-nimbli-ink outline-none transition-colors duration-200 focus-visible:border-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/35 motion-reduce:transition-none"
        />
      )
    })

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4"
      role="group"
      aria-label="Activatiecode, 6 cijfers"
    >
      <div className="flex gap-3 sm:gap-4">{group(0, 3)}</div>
      <span className="h-0.5 w-6 shrink-0 self-center rounded-full bg-gray-300" aria-hidden />
      <div className="flex gap-3 sm:gap-4">{group(3, 3)}</div>
    </div>
  )
}

export default function LoginWithCode() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const { digits, setRef, handleChange, handleKeyDown, handlePaste, isComplete, code } =
    useActivationCode()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isComplete || checking) return
    setInviteError(null)
    setChecking(true)
    try {
      const codeWithDash = `${code.slice(0, 3)}-${code.slice(3)}`
      const { data: rows, error } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, email, role, invite_code, user_id')
        .in('invite_code', [code, codeWithDash])

      if (error) {
        setInviteError('Kon de code niet controleren. Probeer later opnieuw.')
        return
      }

      const grouped = new Map()
      for (const r of rows ?? []) {
        const key = r.invite_code ?? ''
        const list = grouped.get(key)
        if (list) list.push(r)
        else grouped.set(key, [r])
      }

      let child
      let parent
      for (const list of grouped.values()) {
        const c = list.find((r) => r.role === 'child' && r.user_id == null)
        const p = list.find((r) => r.role === 'parent' && r.user_id == null)
        if (c && p) {
          child = c
          parent = p
          break
        }
      }

      if (!child || !parent) {
        setInviteError(
          'Deze code is ongeldig of al gebruikt. Vraag een nieuwe code aan je kinesist.'
        )
        return
      }

      const next = {
        inviteCode: code,
        childProfile: {
          id: child.id,
          firstname: child.firstname,
          lastname: child.lastname,
        },
        parentProfile: {
          id: parent.id,
          firstname: parent.firstname,
          lastname: parent.lastname,
          email: parent.email,
        },
      }
      navigate('/register/ouder', { state: next })
    } finally {
      setChecking(false)
    }
  }

  function handleResend() {
    /* frontend only — wire to API later */
  }

  return (
    <div className="flex min-h-svh flex-col bg-nimbli-canvas font-nimbli-body text-nimbli-ink">
      <header className="shrink-0 px-4 pt-8 pb-4 sm:px-7 sm:pt-12">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md font-nimbli-heading text-lg font-bold text-nimbli-ink transition-colors duration-200 hover:text-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none motion-reduce:transition-none"
        >
          <ArrowLeft className="size-5 shrink-0" aria-hidden strokeWidth={2.25} />
          Terug
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <div className="w-full max-w-[520px]">
          <h1 className="text-center font-nimbli-heading text-[1.75rem] font-extrabold leading-tight text-nimbli-ink sm:text-4xl sm:leading-10">
            Voer je activatiecode in:
          </h1>
          <p className="mt-4 text-center text-base text-nimbli-muted">
            Deze app werkt enkel met een code van je kinesist.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col items-stretch gap-8">
            <CodeSlots
              digits={digits}
              setRef={setRef}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
            />

            {inviteError ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {inviteError}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={!isComplete || checking}
              className="h-12 w-full cursor-pointer rounded font-nimbli-heading text-lg font-black text-nimbli-foreground shadow-[0_2px_0_0_var(--color-nimbli-shadow)] transition-all duration-200 hover:brightness-105 active:translate-y-px active:shadow-none disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none bg-nimbli border-0"
            >
              {checking ? 'Controleren…' : 'Doorgaan'}
            </Button>

            <p className="text-center text-base text-nimbli-muted">
              Geen code gekregen?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="cursor-pointer font-nimbli-heading font-semibold text-nimbli-muted underline decoration-solid underline-offset-2 transition-colors duration-200 hover:text-nimbli-ink focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-nimbli/40 focus-visible:outline-none motion-reduce:transition-none"
              >
                Contacteer je kinesist
              </button>
            </p>
          </form>
        </div>
      </main>

      <footer className="mt-auto flex shrink-0 flex-wrap items-center justify-center gap-6 gap-y-2 px-4 py-8 text-base text-nimbli-muted">
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

