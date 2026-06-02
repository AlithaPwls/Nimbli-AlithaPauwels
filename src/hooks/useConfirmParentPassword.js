import { useCallback, useMemo, useState } from 'react'

/**
 * Single field: confirm existing parent password (not a new password form).
 */
export function useConfirmParentPassword() {
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)

  const error = useMemo(() => {
    if (!touched) return null
    if (!password.trim()) return 'Vul je ouderwachtwoord in.'
    return null
  }, [password, touched])

  const validate = useCallback(() => {
    setTouched(true)
    return password.trim().length > 0
  }, [password])

  return {
    password,
    setPassword,
    error,
    validate,
    reset: () => {
      setPassword('')
      setTouched(false)
    },
  }
}
