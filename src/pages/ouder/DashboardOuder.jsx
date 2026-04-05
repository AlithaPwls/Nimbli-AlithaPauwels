import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'

export default function DashboardOuder() {
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  if (!profile) {
    return <div className="text-center py-8">Profiel niet gevonden</div>
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 font-nimbli-body text-nimbli-ink">
      <h1 className="font-nimbli-heading text-2xl font-extrabold">{profile.firstname}</h1>
      <p className="mt-2 text-sm text-nimbli-muted">
        Uitloggen om opnieuw te testen met e-mail en wachtwoord, of om de registratieflow opnieuw te
        doorlopen.
      </p>
      <button
        type="button"
        onClick={() => void logout()}
        disabled={logoutLoading}
        className="mt-6 rounded-lg border border-nimbli-slot-border bg-white px-4 py-2.5 text-sm font-semibold text-nimbli-ink transition-colors hover:bg-nimbli-canvas disabled:opacity-50"
      >
        {logoutLoading ? 'Bezig…' : 'Uitloggen'}
      </button>
    </div>
  )
}
