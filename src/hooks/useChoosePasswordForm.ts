import { useCallback, useMemo, useState } from 'react'

const MIN_LENGTH = 8

export type ChoosePasswordErrors = {
  password?: string
  repeat?: string
  terms?: string
}

export function useChoosePasswordForm() {
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [touched, setTouched] = useState(false)

  const errors: ChoosePasswordErrors = useMemo(() => {
    if (!touched) return {}
    const e: ChoosePasswordErrors = {}
    if (!password) e.password = 'Vul een wachtwoord in.'
    else if (password.length < MIN_LENGTH)
      e.password = `Minimaal ${MIN_LENGTH} tekens.`
    if (!repeatPassword) e.repeat = 'Herhaal je wachtwoord.'
    else if (password !== repeatPassword) e.repeat = 'Wachtwoorden komen niet overeen.'
    if (!agreed) e.terms = 'Ga akkoord met de voorwaarden om verder te gaan.'
    return e
  }, [password, repeatPassword, agreed, touched])

  const isValid =
    password.length >= MIN_LENGTH &&
    repeatPassword === password &&
    repeatPassword.length > 0 &&
    agreed

  const validate = useCallback(() => {
    setTouched(true)
    return (
      password.length >= MIN_LENGTH &&
      password === repeatPassword &&
      agreed
    )
  }, [password, repeatPassword, agreed])

  return {
    password,
    setPassword,
    repeatPassword,
    setRepeatPassword,
    agreed,
    setAgreed,
    errors,
    touched,
    setTouched,
    isValid,
    validate,
  }
}
