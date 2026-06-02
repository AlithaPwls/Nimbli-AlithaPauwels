import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.js'
import {
  PARENT_DASHBOARD_SWITCH_COPY,
  useParentPasswordGate,
} from '@/hooks/useParentPasswordGate.js'
import { withChildSearch } from '@/lib/activeChild.js'

/**
 * Leave kind view for parent dashboard (always requires parent password).
 */
export function useSwitchToParentDashboard(activeChildId = null) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const gate = useParentPasswordGate()

  const goToParentDashboard = useCallback(() => {
    const childIdForUrl = role === 'parent' ? activeChildId : null
    const target = childIdForUrl
      ? withChildSearch('/dashboard/ouder', childIdForUrl)
      : '/dashboard/ouder'
    navigate(target)
  }, [activeChildId, navigate, role])

  const requestSwitch = useCallback(() => {
    if (!gate.canVerify) return
    gate.runProtected(goToParentDashboard, PARENT_DASHBOARD_SWITCH_COPY)
  }, [goToParentDashboard, gate])

  return {
    open: gate.open,
    setOpen: gate.setOpen,
    password: gate.password,
    setPassword: gate.setPassword,
    loading: gate.loading,
    error: gate.error,
    canSwitch: gate.canVerify,
    dialogCopy: gate.dialogCopy,
    requestSwitch,
    confirmSwitch: gate.confirm,
  }
}
