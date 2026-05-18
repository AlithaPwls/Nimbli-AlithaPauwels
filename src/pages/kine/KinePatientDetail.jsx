import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import KinePatientDeleteDialog from '@/components/kine/KinePatientDeleteDialog.jsx'
import KinePatientDetailTabs from '@/components/kine/KinePatientDetailTabs.jsx'
import KinePatientHeaderCard from '@/components/kine/KinePatientHeaderCard.jsx'
import KinePatientInviteDialog from '@/components/kine/KinePatientInviteDialog.jsx'
import KinePatientProgressSection from '@/components/kine/KinePatientProgressSection.jsx'
import KinePatientDetailSkeleton from '@/components/kine/KinePatientDetailSkeleton.jsx'
import KinePatientTabPlaceholder from '@/components/kine/KinePatientTabPlaceholder.jsx'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { useDeleteKinePatient } from '@/hooks/kine/useDeleteKinePatient.js'
import { useKinePatientDetail } from '@/hooks/kine/useKinePatientDetail.js'

const PLACEHOLDER_TITLES = {
  sessies: 'Sessies',
  oefeningen: 'Oefeningen',
  logboek: 'Logboek',
}

export default function KinePatientDetail() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null

  const { patient, parent, weeklyChart, loading, error, notFound } = useKinePatientDetail({
    patientId,
    practiceId,
  })

  const {
    deletePatient,
    loading: deleting,
    error: deleteError,
    clearError: clearDeleteError,
  } = useDeleteKinePatient()

  const [activeTab, setActiveTab] = useState('overzicht')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isRegistered = Boolean(patient?.isRegistered || parent?.isRegistered)
  const showContent = !loading && !notFound && patient

  function openDeleteDialog() {
    clearDeleteError()
    setDeleteOpen(true)
  }

  async function handleConfirmDelete() {
    const res = await deletePatient({ patientId: patient.id })
    if (res.ok) {
      setDeleteOpen(false)
      navigate('/dashboard/kine', { replace: true })
    }
  }

  return (
    <div className="min-h-svh bg-nimbli-foreground">
      <div className="mx-auto max-w-5xl px-8 py-10 font-nimbli-body text-nimbli-ink">
        <OuderBackLink to="/dashboard/kine" />

        {loading ? (
          <KinePatientDetailSkeleton />
        ) : notFound ? (
          <div className="mt-10 rounded-2xl border-2 border-[#e1dbd3] bg-white px-6 py-12 text-center shadow-[0_2px_0_0_#e1dbd3]">
            <p className="font-nimbli-heading text-lg font-bold text-nimbli-ink">Patiënt niet gevonden</p>
            <p className="mt-2 text-sm text-nimbli-muted">
              Deze patiënt bestaat niet of hoort niet bij jouw praktijk.
            </p>
          </div>
        ) : error ? (
          <p className="mt-10 text-sm font-semibold text-red-600" role="alert">
            Kon patiëntgegevens niet laden. Probeer later opnieuw.
          </p>
        ) : showContent ? (
          <div className="mt-8 flex flex-col gap-6">
            <KinePatientHeaderCard
              patient={patient}
              parent={parent}
              qrDisabled={!patient.inviteCode}
              onQrClick={() => setInviteOpen(true)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                disabled
                title="Binnenkort beschikbaar"
                className="h-11 rounded bg-nimbli font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 disabled:opacity-60"
              >
                <Plus className="mr-2 size-[18px]" aria-hidden />
                Oefening toevoegen
              </Button>
            </div>

            <KinePatientDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'overzicht' ? (
              <KinePatientProgressSection weeklyChart={weeklyChart} />
            ) : (
              <KinePatientTabPlaceholder title={PLACEHOLDER_TITLES[activeTab] ?? '—'} />
            )}
          </div>
        ) : null}

             <Button
                type="button"
                variant="destructive"
                onClick={openDeleteDialog}
                className="h-11 font-nimbli-heading text-sm font-bold"
              >
                <Trash2 className="mr-2 size-[18px]" aria-hidden />
                Patiënt verwijderen
              </Button>

        <KinePatientInviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          inviteCode={patient?.inviteCode}
        />

        <KinePatientDeleteDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            if (!open) clearDeleteError()
            setDeleteOpen(open)
          }}
          patientName={patient?.name ?? 'deze patiënt'}
          isRegistered={isRegistered}
          loading={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  )
}
