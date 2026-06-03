import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import LoadingScreen from '@/components/LoadingScreen.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import KineMobileNav from './KineMobileNav.jsx'
import KineSidebar from './KineSidebar.jsx'

export default function KineLayout() {
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const [scrollContainer, setScrollContainer] = useState(null)
  const { profile, loading } = useAuth()

  const setMainRef = useCallback((node) => {
    mainRef.current = node
    setScrollContainer(node)
  }, [])

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
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <KineMobileNav scrollEl={scrollContainer} />
        <main ref={setMainRef} className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
