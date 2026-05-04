import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.js'

const ROLE_PATH = {
  child: '/dashboard/kind',
  parent: '/dashboard/ouder',
  kine: '/dashboard/kine',
}

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {'child' | 'parent' | 'kine'} [props.allowedRole] — if set, wrong role → redirect to their dashboard or login
 * @param {Array<'child' | 'parent' | 'kine'>} [props.allowedRoles] — if set, role must be in list
 */
export default function ProtectedRoute({ children, allowedRole, allowedRoles }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return <div>Laden…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If we have a session but role is not resolved yet (or profile lookup failed),
  // don't bounce the user back to /login — that feels like a random logout.
  if (!role) {
    return <div>Laden…</div>
  }
  if (!ROLE_PATH[role]) {
    return <Navigate to="/login" replace />
  }

  const allowed = Array.isArray(allowedRoles) && allowedRoles.length > 0 ? allowedRoles : null
  if (allowed && !allowed.includes(role)) {
    const fallback = ROLE_PATH[role] ?? '/login'
    return <Navigate to={fallback} replace />
  }

  if (!allowed && allowedRole && role !== allowedRole) {
    const fallback = ROLE_PATH[role] ?? '/login'
    return <Navigate to={fallback} replace />
  }

  return children
}
