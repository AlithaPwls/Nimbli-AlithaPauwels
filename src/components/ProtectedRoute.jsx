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
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return <div>Laden…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!role || !ROLE_PATH[role]) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    const fallback = ROLE_PATH[role] ?? '/login'
    return <Navigate to={fallback} replace />
  }

  return children
}
