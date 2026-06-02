import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useActiveChildSelection } from '@/hooks/ouder/useActiveChildSelection.js'
import { useConfirmParentPassword } from '@/hooks/useConfirmParentPassword.js'
import { registerPendingChild } from '@/hooks/useRegisterPendingChild.js'
import { useAuth } from '@/hooks/useAuth.js'
import OuderSidebar from '@/components/ouder/OuderSidebar.jsx'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import { Button } from '@/components/ui/button'
import { buildChildSearch, readActiveChildId } from '@/lib/activeChild.js'

function childDisplayName(p) {
  return `${p?.firstname ?? ''} ${p?.lastname ?? ''}`.trim() || 'Kind'
}

export default function OuderKindActiveren() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { profile, loading } = useProfile()
  const { logout, loading: logoutLoading } = useLogout()
  const { activatedChildren, pendingChildren, activeChildId, setSelectedChildId } =
    useActiveChildSelection(profile)

  const requestedChildId = readActiveChildId(searchParams)

  const pendingChild = useMemo(() => {
    const list = pendingChildren ?? []
    if (requestedChildId) {
      return list.find((c) => c.id === requestedChildId) ?? list[0] ?? null
    }
    return list[0] ?? null
  }, [pendingChildren, requestedChildId])

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const { password, setPassword, error: passwordError, validate } = useConfirmParentPassword()

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  if (!profile) {
    return <div className="text-center py-8">Profiel niet gevonden</div>
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    if (!validate() || !pendingChild?.id || !user?.id) return

    setSubmitting(true)
    try {
      const result = await registerPendingChild({
        childProfileId: pendingChild.id,
        parentAuthUserId: user.id,
        parentEmail: profile?.email?.trim() ?? '',
        password,
      })
      if (!result.ok) {
        setFormError(result.message)
        return
      }
      navigate(`/dashboard/ouder${buildChildSearch(pendingChild.id)}`, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'h-12 w-full rounded-lg border border-[#e1dbd3] bg-white px-3 text-sm text-nimbli-ink outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40'

  return (
    <div className="flex h-svh overflow-hidden bg-nimbli-canvas">
      <OuderSidebar
        logout={logout}
        logoutLoading={logoutLoading}
        childrenList={activatedChildren}
        selectedChildId={activeChildId}
        onSelectChild={setSelectedChildId}
      />

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-lg px-8 py-10 font-nimbli-body text-nimbli-ink">
          <OuderBackLink to="/dashboard/ouder" />

          {!pendingChild ? (
            <div className="mt-8 rounded-lg border border-[#e1dbd3] bg-white p-6">
              <p className="font-nimbli-heading text-lg font-bold">Geen kinderen wachten op activatie</p>
              <p className="mt-2 text-sm text-nimbli-muted">
                Vraag je kinesist om een nieuw kind te koppelen, of gebruik een activatiecode via
                registreren.
              </p>
              <Button type="button" className="mt-4 bg-nimbli" onClick={() => navigate('/dashboard/ouder')}>
                Naar dashboard
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mt-8 font-nimbli-heading text-3xl font-extrabold tracking-tight">
                Activeer {childDisplayName(pendingChild)}
              </h1>
              <p className="mt-3 text-sm text-nimbli-muted">
                Vul je <strong className="font-semibold text-nimbli-ink">ouderwachtwoord</strong> in
                (hetzelfde als bij inloggen). Je kiest hier geen nieuw wachtwoord — het kindaccount
                krijgt automatisch hetzelfde wachtwoord als je ouderaccount.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-nimbli-muted">Ouderwachtwoord</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Je ouderwachtwoord"
                    className={inputClass}
                  />
                </label>
                {passwordError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {passwordError}
                  </p>
                ) : null}
                {formError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {formError}
                  </p>
                ) : null}
                <Button type="submit" disabled={submitting} className="h-12 bg-nimbli font-bold">
                  {submitting ? 'Bezig…' : 'Kind activeren'}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
