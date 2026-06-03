import { Plus } from 'lucide-react'
import KinePatientExerciseRow from '@/components/kine/KinePatientExerciseRow.jsx'
import { Button } from '@/components/ui/button'

export default function KinePatientExercisesSection({
  exercises = [],
  loading = false,
  patientName = 'de patiënt',
  onAddExercise,
  onDeleteExercise,
  addExerciseDisabled = false,
  deletingExerciseId = null,
  deleteExerciseError = null,
}) {
  const list = Array.isArray(exercises) ? exercises : []
  const isEmpty = !loading && list.length === 0

  return (
    <section className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 pb-8 pt-8 shadow-[0_2px_0_0_#e1dbd3] max-lg:px-5 max-lg:pb-6 max-lg:pt-6 max-sm:px-4 max-sm:pb-5 max-sm:pt-5">
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h2 className="font-nimbli-heading text-[22px] font-bold text-[#1a1a1a] max-sm:text-lg">
            Oefeningen
          </h2>
          <Button
            type="button"
            disabled={addExerciseDisabled || !onAddExercise}
            onClick={onAddExercise}
            className="h-11 w-full shrink-0 rounded bg-nimbli font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 disabled:opacity-60 sm:w-auto"
          >
            <Plus className="mr-2 size-[18px]" aria-hidden />
            Oefening toevoegen
          </Button>
        </div>
        <p className="mt-1 text-[15px] text-nimbli-muted max-sm:text-sm">Toegewezen aan {patientName}</p>
      </header>

      <div className="mt-6 max-sm:mt-4">
        {loading ? (
          <p className="text-sm text-nimbli-muted">Oefeningen laden…</p>
        ) : isEmpty ? (
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-6 py-12 text-center">
            <p className="font-nimbli-heading text-base font-bold text-nimbli-ink">
              Nog geen oefeningen toegewezen
            </p>
            <p className="mt-2 text-sm text-nimbli-muted">
              Wijs oefeningen toe via &quot;Oefening toevoegen&quot; of bij het aanmaken van een patiënt.
            </p>
          </div>
        ) : (
          <>
            {deleteExerciseError ? (
              <p className="mb-4 text-sm font-semibold text-red-600" role="alert">
                {deleteExerciseError}
              </p>
            ) : null}

            <ul className="flex flex-col gap-4">
              {list.map((exercise) => (
                <li key={exercise.assignmentId ?? exercise.id}>
                  <KinePatientExerciseRow
                    exercise={exercise}
                    deleting={deletingExerciseId === exercise.assignmentId}
                    deleteDisabled={!exercise.assignmentId}
                    onDelete={onDeleteExercise}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
