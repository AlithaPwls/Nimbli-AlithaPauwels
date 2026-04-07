import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.js'
import KineSidebar from './KineSidebar.jsx'

export default function KineLayout() {
  const navigate = useNavigate()
  const { profile, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    // Only redirect once we actually have a profile row.
    // When profile fetching is slow/failing, redirecting here feels like a logout.
    if (profile && profile.practice_id == null) {
      navigate('/register/kine', { replace: true })
    }
  }, [loading, profile, navigate])

  if (loading || !profile || profile.practice_id == null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-nimbli-canvas font-nimbli-body text-nimbli-muted">
        Laden…
      </div>
    )
  }

  return (
    <div className="flex min-h-svh bg-nimbli-canvas">
      <KineSidebar />
      <main className="min-h-svh min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
