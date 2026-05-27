import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import AssignPatientExercisesDialog from '@/components/kine/AssignPatientExercisesDialog.jsx'
import KinePatientDeleteDialog from '@/components/kine/KinePatientDeleteDialog.jsx'
import KinePatientDeleteNoteDialog from '@/components/kine/KinePatientDeleteNoteDialog.jsx'
import KinePatientDetailTabs from '@/components/kine/KinePatientDetailTabs.jsx'
import KinePatientHeaderCard from '@/components/kine/KinePatientHeaderCard.jsx'
import KinePatientInviteDialog from '@/components/kine/KinePatientInviteDialog.jsx'
import KinePatientProgressSection from '@/components/kine/KinePatientProgressSection.jsx'
import KinePatientExercisesSection from '@/components/kine/KinePatientExercisesSection.jsx'
import KinePatientLogboekSection from '@/components/kine/KinePatientLogboekSection.jsx'
import PatientNoteDialog from '@/components/kine/PatientNoteDialog.jsx'
import KinePatientSessionsSection from '@/components/kine/KinePatientSessionsSection.jsx'
import KinePatientDetailSkeleton from '@/components/kine/KinePatientDetailSkeleton.jsx'
import OuderBackLink from '@/components/ouder/OuderBackLink.jsx'
import { useAuth } from '@/hooks/useAuth.js'
import { useAssignPatientExercises } from '@/hooks/kine/useAssignPatientExercises.js'
import { useDeleteKinePatient } from '@/hooks/kine/useDeleteKinePatient.js'
import { useDeletePatientExerciseAssignment } from '@/hooks/kine/useDeletePatientExerciseAssignment.js'
import { useKinePatientDetail } from '@/hooks/kine/useKinePatientDetail.js'
import { usePatientNotes } from '@/hooks/kine/usePatientNotes.js'

function PatientDetailTabPanel({
  activeTab,
  weeklyChart,
  sessions,
  assignments,
  loading,
  patientName,
  onAddExercise,
  onDeleteExercise,
  deletingExerciseId,
  deleteExerciseError,
  notes,
  notesLoading,
  onNewNote,
  onEditNote,
  onDeleteNote,
}) {
  if (activeTab === 'overzicht') {
    return <KinePatientProgressSection weeklyChart={weeklyChart} />
  }
  if (activeTab === 'sessies') {
    return <KinePatientSessionsSection sessions={sessions} loading={loading} patientName={patientName} />
  }
  if (activeTab === 'oefeningen') {
    return (
      <KinePatientExercisesSection
        exercises={assignments}
        loading={loading}
        patientName={patientName}
        onAddExercise={onAddExercise}
        onDeleteExercise={onDeleteExercise}
        deletingExerciseId={deletingExerciseId}
        deleteExerciseError={deleteExerciseError}
      />
    )
  }
  if (activeTab === 'logboek') {
    return (
      <KinePatientLogboekSection
        notes={notes}
        loading={notesLoading}
        patientName={patientName}
        onNewNote={onNewNote}
        onEditNote={onEditNote}
        onDeleteNote={onDeleteNote}
      />
    )
  }
  return null
}

export default function KinePatientDetail() {
  const navigate = useNavigate()
  const { patientId } = useParams()
  const { profile } = useAuth()
  const practiceId = profile?.practice_id ?? null

  const { patient, parent, weeklyChart, sessions, assignments, loading, error, notFound, refetch } =
    useKinePatientDetail({
      patientId,
      practiceId,
    })

  const {
    assign,
    loading: assigning,
    error: assignError,
    clearError: clearAssignError,
  } = useAssignPatientExercises()

  const {
    deletePatient,
    loading: deleting,
    error: deleteError,
    clearError: clearDeleteError,
  } = useDeleteKinePatient()

  const {
    deleteAssignment,
    deletingAssignmentId,
    error: deleteAssignmentError,
    clearError: clearDeleteAssignmentError,
  } = useDeletePatientExerciseAssignment()

  const [activeTab, setActiveTab] = useState('overzicht')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [deleteNoteOpen, setDeleteNoteOpen] = useState(false)
  const [deletingNote, setDeletingNote] = useState(null)

  const {
    notes,
    loading: notesLoading,
    saving: noteSaving,
    saveError: noteSaveError,
    deleting: noteDeleting,
    deleteError: noteDeleteError,
    refetch: refetchNotes,
    clearSaveError: clearNoteSaveError,
    clearDeleteError: clearNoteDeleteError,
    createNote,
    updateNote,
    deleteNote,
  } = usePatientNotes({ patientId })

  const isRegistered = Boolean(patient?.isRegistered || parent?.isRegistered)
  const showContent = !loading && !notFound && patient

  const assignedExerciseIds = assignments.map((a) => a.id).filter(Boolean)

  function openAssignDialog() {
    clearAssignError()
    clearDeleteAssignmentError()
    setAssignOpen(true)
  }

  function openDeleteDialog() {
    clearDeleteError()
    setDeleteOpen(true)
  }

  function openNewNoteDialog() {
    clearNoteSaveError()
    setEditingNote(null)
    setNoteDialogOpen(true)
  }

  function openEditNoteDialog(note) {
    clearNoteSaveError()
    setEditingNote(note)
    setNoteDialogOpen(true)
  }

  function openDeleteNoteDialog(note) {
    clearNoteDeleteError()
    setDeletingNote(note)
    setDeleteNoteOpen(true)
  }

  async function handleConfirmDeleteNote() {
    if (!deletingNote?.id) return

    const res = await deleteNote(deletingNote.id)
    if (res.ok) {
      setDeleteNoteOpen(false)
      setDeletingNote(null)
      refetchNotes({ silent: true })
    }
  }

  async function handleNoteSubmit({ title, content }) {
    if (!patient?.id) return

    const isEdit = Boolean(editingNote?.id)
    const res = isEdit
      ? await updateNote({ id: editingNote.id, title, content })
      : await createNote({
          childId: patient.id,
          authorId: profile?.id ?? null,
          title,
          content,
        })

    if (res.ok) {
      setNoteDialogOpen(false)
      setEditingNote(null)
      refetchNotes({ silent: true })
    }
  }

  async function handleAssignExercises({ selections }) {
    const res = await assign({
      childId: patient.id,
      assignments: selections,
      assignedBy: profile?.id ?? null,
      alreadyAssignedIds: assignedExerciseIds,
    })
    if (res.ok) {
      setAssignOpen(false)
      refetch({ silent: true })
    }
  }

  async function handleDeleteExercise(exercise) {
    const res = await deleteAssignment({
      assignmentId: exercise?.assignmentId,
      childId: patient?.id,
    })

    if (res.ok) {
      refetch({ silent: true })
    }
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


            <KinePatientDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <PatientDetailTabPanel
              activeTab={activeTab}
              weeklyChart={weeklyChart}
              sessions={sessions}
              assignments={assignments}
              loading={loading}
              patientName={patient.name}
              onAddExercise={openAssignDialog}
              onDeleteExercise={handleDeleteExercise}
              deletingExerciseId={deletingAssignmentId}
              deleteExerciseError={deleteAssignmentError}
              notes={notes}
              notesLoading={notesLoading}
              onNewNote={openNewNoteDialog}
              onEditNote={openEditNoteDialog}
              onDeleteNote={openDeleteNoteDialog}
            />

            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="destructive"
                onClick={openDeleteDialog}
                className="h-11 w-fit font-nimbli-heading text-sm font-bold"
              >
                <Trash2 className="mr-2 size-[18px]" aria-hidden />
                Patiënt verwijderen
              </Button>
            </div>
          </div>
        ) : null}

        <KinePatientDeleteNoteDialog
          open={deleteNoteOpen}
          onOpenChange={(open) => {
            if (!open) {
              clearNoteDeleteError()
              setDeletingNote(null)
            }
            setDeleteNoteOpen(open)
          }}
          noteTitle={deletingNote?.title}
          loading={noteDeleting}
          error={noteDeleteError}
          onConfirm={handleConfirmDeleteNote}
        />

        <PatientNoteDialog
          open={noteDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              clearNoteSaveError()
              setEditingNote(null)
            }
            setNoteDialogOpen(open)
          }}
          mode={editingNote ? 'edit' : 'create'}
          initialNote={editingNote}
          loading={noteSaving}
          error={noteSaveError}
          onSubmit={handleNoteSubmit}
        />

        <AssignPatientExercisesDialog
          open={assignOpen}
          onOpenChange={(open) => {
            if (!open) clearAssignError()
            setAssignOpen(open)
          }}
          patientName={patient?.name ?? 'de patiënt'}
          practiceId={practiceId}
          assignedExerciseIds={assignedExerciseIds}
          loading={assigning}
          error={assignError}
          onConfirm={handleAssignExercises}
        />

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
