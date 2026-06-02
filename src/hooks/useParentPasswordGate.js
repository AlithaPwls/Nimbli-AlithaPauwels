import { useCallback, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth.js'
import { verifyParentPassword } from '@/lib/resolveParentEmail.js'

export const PARENT_DASHBOARD_SWITCH_COPY = {
  title: 'Naar ouderdashboard',
  description:
    'Voor je veiligheid vragen we je wachtwoord om terug te schakelen naar het ouderaccount.',
}

export const CHILD_PROFILE_SWITCH_COPY = {
  title: 'Ander kind kiezen',
  description:
    'Vul het wachtwoord van je ouderaccount in om het kinddashboard van een ander kind te openen.',
}

/**
 * Runs an action only after parent password verification (parent session or child → parent re-auth).
 */
export function useParentPasswordGate() {
  const { role, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dialogCopy, setDialogCopy] = useState(CHILD_PROFILE_SWITCH_COPY)
  const pendingActionRef = useRef(null)

  const canVerify = role === 'parent' || (role === 'child' && Boolean(profile?.id))

  const runProtected = useCallback(
    (action, copy = CHILD_PROFILE_SWITCH_COPY) => {
      if (!canVerify || typeof action !== 'function') return
      pendingActionRef.current = action
      setDialogCopy(copy)
      setPassword('')
      setError(null)
      setOpen(true)
    },
    [canVerify]
  )

  const confirm = useCallback(async () => {
    if (!canVerify) return

    setLoading(true)
    setError(null)

    try {
      await verifyParentPassword({ role, profile, password })
      const action = pendingActionRef.current
      pendingActionRef.current = null
      setPassword('')
      setOpen(false)
      action?.()
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [canVerify, password, profile, role])

  return {
    open,
    setOpen,
    password,
    setPassword,
    loading,
    error,
    canVerify,
    dialogCopy,
    runProtected,
    confirm,
  }
}
