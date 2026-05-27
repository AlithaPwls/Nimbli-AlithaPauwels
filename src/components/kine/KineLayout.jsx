import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import LoadingScreen from '@/components/LoadingScreen.jsx'
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
    return <LoadingScreen title="Praktijk laden" message="We zetten je dashboard klaar." />
  }

  return (
    <div className="flex h-svh overflow-hidden bg-nimbli-canvas">
      <KineSidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
