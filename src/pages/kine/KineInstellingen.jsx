import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import KinePracticeTeamList from '@/components/kine/KinePracticeTeamList.jsx'
import KineTeamMemberDeleteDialog from '@/components/kine/KineTeamMemberDeleteDialog.jsx'
import KineTeamMemberDetailDialog from '@/components/kine/KineTeamMemberDetailDialog.jsx'
import OuderSettingsCard from '@/components/ouder/OuderSettingsCard.jsx'
import OuderAddressField from '@/components/ouder/OuderAddressField.jsx'
import OuderTextField from '@/components/ouder/OuderTextField.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { useLogout } from '@/hooks/useLogout.js'
import { useDeleteKineTeamMember } from '@/hooks/kine/useDeleteKineTeamMember.js'
import { useKineProfileForm } from '@/hooks/kine/useKineProfileForm.js'
import { usePracticeKines } from '@/hooks/kine/usePracticeKines.js'
import { useUpdateKineTeamMember } from '@/hooks/kine/useUpdateKineTeamMember.js'

const primaryButtonClass =
  'h-10 rounded bg-nimbli px-6 font-nimbli-heading text-base font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 disabled:opacity-60'

const outlineButtonClass =
  'h-10 rounded border border-nimbli bg-white px-6 font-nimbli-heading text-base font-black text-nimbli shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli-canvas disabled:opacity-60'

const asidePrimaryButtonClass = `${primaryButtonClass} w-full`
const asideOutlineButtonClass = `${outlineButtonClass} w-full`

export default function KineInstellingen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshProfile } = useAuth()
  const { logout, loading: logoutLoading } = useLogout()
  const {
    profile,
    loading,
    form,
    updateField,
    reset,
    save,
    saving,
    error,
    setError,
    savedMessage,
    isDirty,
  } = useKineProfileForm()

  const practiceId = profile?.practice_id ?? null
  const {
    members: practiceKines,
    loading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
  } = usePracticeKines({
    practiceId,
    currentProfileId: profile?.id ?? null,
  })

  const {
    updateMember,
    loading: updateMemberLoading,
    error: updateMemberError,
    clearError: clearUpdateMemberError,
  } = useUpdateKineTeamMember()

  const {
    deleteMember,
    loading: deleteMemberLoading,
    error: deleteMemberError,
    clearError: clearDeleteMemberError,
  } = useDeleteKineTeamMember()

  const [selectedMember, setSelectedMember] = useState(null)
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [memberSavedMessage, setMemberSavedMessage] = useState(null)

  useEffect(() => {
    if (location.state?.teamRefresh) {
      refetchTeam()
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state?.teamRefresh, navigate, refetchTeam])

  async function handleSave() {
    const result = await save()
    if (!result.ok && result.message) {
      setError(result.message)
    }
  }

  function handleOpenMember(member) {
    clearUpdateMemberError()
    setMemberSavedMessage(null)
    setSelectedMember(member)
  }

  function handleCloseMemberDetail(open) {
    if (!open) {
      setSelectedMember(null)
      clearUpdateMemberError()
      setMemberSavedMessage(null)
    }
  }

  async function handleSaveMember(payload) {
    setMemberSavedMessage(null)
    const result = await updateMember(payload)
    if (result.ok) {
      setMemberSavedMessage('Wijzigingen opgeslagen.')
      refetchTeam()
      setSelectedMember((prev) => {
        if (!prev || prev.id !== payload.kineId) return prev
        const firstname = String(payload.firstname ?? '').trim()
        const lastname = String(payload.lastname ?? '').trim()
        return {
          ...prev,
          firstname,
          lastname,
          name: [firstname, lastname].filter(Boolean).join(' ') || prev.name,
          email: String(payload.email ?? '').trim(),
          phone: String(payload.phone ?? '').trim() || null,
          address: String(payload.address ?? '').trim() || null,
          dateOfBirth: payload.dateOfBirth || null,
        }
      })
      if (payload.kineId === profile?.id) {
        await refreshProfile()
      }
    }
    return result
  }

  function handleRequestDelete(member) {
    clearDeleteMemberError()
    setMemberToDelete(member)
  }

  async function handleConfirmDeleteMember() {
    if (!memberToDelete?.id) return
    const result = await deleteMember({ kineId: memberToDelete.id })
    if (result.ok) {
      setMemberToDelete(null)
      setSelectedMember(null)
      refetchTeam()
    }
  }

  if (loading) {
    return (
      <div className="min-h-svh bg-nimbli-foreground">
        <div className="mx-auto max-w-5xl px-8 py-10 font-nimbli-body text-sm text-nimbli-muted">
          Instellingen laden…
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-svh bg-nimbli-foreground">
        <div className="mx-auto max-w-5xl px-8 py-10 font-nimbli-body text-sm text-nimbli-muted">
          Profiel niet gevonden.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-nimbli-foreground">
      <div className="mx-auto max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
        <h1 className="font-nimbli-heading text-4xl font-extrabold tracking-tight text-black">
          Instellingen
        </h1>

        <KineTeamMemberDetailDialog
          member={selectedMember}
          onOpenChange={handleCloseMemberDetail}
          onSave={handleSaveMember}
          onRequestDelete={handleRequestDelete}
          saving={updateMemberLoading}
          saveError={updateMemberError}
          savedMessage={memberSavedMessage}
        />

        <KineTeamMemberDeleteDialog
          open={Boolean(memberToDelete)}
          onOpenChange={(open) => {
            if (!open) {
              setMemberToDelete(null)
              clearDeleteMemberError()
            }
          }}
          memberName={memberToDelete?.name}
          loading={deleteMemberLoading}
          error={deleteMemberError}
          onConfirm={handleConfirmDeleteMember}
        />

        <section className="mt-10 w-full">
          <h2 className="text-xl font-normal text-black">Mijn profiel</h2>

          <div className="mt-5 flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
            <div className="w-full max-w-[520px]">
              <OuderSettingsCard className="space-y-3">
                <OuderTextField
                  label="Naam"
                  placeholder="Voor- en achternaam"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                />
                <OuderTextField
                  label="Email adres"
                  placeholder="Email adres"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
                <OuderTextField
                  label="Telefoonnummer"
                  placeholder="Telefoonnummer"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
                <OuderAddressField
                  label="Adres"
                  placeholder="Adres"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
                <OuderTextField
                  label="Geboortedatum"
                  placeholder="bv. 29 juli 2001"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                />
                <OuderTextField
                  label="Wachtwoord"
                  placeholder="Nieuw wachtwoord (optioneel)"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                />
              </OuderSettingsCard>

              {error ? (
                <p className="mt-4 text-sm font-medium text-[#ca0000]" role="alert">
                  {error}
                </p>
              ) : null}
              {savedMessage ? (
                <p className="mt-4 text-sm font-medium text-nimbli" role="status">
                  {savedMessage}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className={outlineButtonClass}
                  disabled={saving || !isDirty}
                  onClick={reset}
                >
                  Annuleren
                </Button>
                <Button
                  type="button"
                  className={primaryButtonClass}
                  disabled={saving || !isDirty}
                  onClick={() => void handleSave()}
                >
                  {saving ? 'Opslaan…' : 'Opslaan'}
                </Button>
              </div>
            </div>

            <aside className="flex w-full flex-col gap-4 lg:w-[min(100%,320px)] lg:shrink-0">
              <KinePracticeTeamList
                members={practiceKines}
                loading={teamLoading}
                error={teamError}
                addButtonClassName={`${asidePrimaryButtonClass} mt-4`}
                onAddMember={() => navigate('/dashboard/kine/instellingen/nieuwe-gebruiker')}
                onSelectMember={handleOpenMember}
              />

              <Button
                type="button"
                variant="outline"
                className={asideOutlineButtonClass}
                disabled={logoutLoading}
                onClick={() => void logout()}
              >
                {logoutLoading ? 'Uitloggen…' : 'Log uit'}
              </Button>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}
