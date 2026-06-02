import { useCallback, useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useActiveChildId } from '@/hooks/kind/useActiveChildId.js'
import { categoryToneClasses, EXERCISE_THUMBNAIL_SELECT, normalizeExerciseRow } from '@/lib/exerciseDisplay.js'
import { addDaysLocal, isAssignmentScheduledOnDate, startOfDayLocal } from '@/lib/kind/weekCalendar.js'

function toArray(v) {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

function formatRepsLine(assignment, exerciseRow) {
  const n = assignment?.reps
  if (typeof n === 'number' && Number.isFinite(n)) {
    const u = (assignment?.rep_unit || '').trim()
    if (u) return `${n} ⟲ ${u}` // Voeg icon Repeat toe tussen n en eenheid
    return `⟲ ${n}`
  }
  const norm = normalizeExerciseRow(exerciseRow)
  if (typeof norm.reps === 'number' && Number.isFinite(norm.reps)) {
    return `${norm.reps}`
  }
  if (typeof norm.reps === 'string' && norm.reps.trim() && norm.reps !== '—') {
    return norm.reps.trim()
  }
  return '—'
}

/**
 * Resolves the active child profile id (child session, or linked child for a parent on the kind dashboard)
 * and loads exercise assignments with exercise details for the “oefeningen van vandaag” popover.
 */
export function useKindTodayExercises() {
  const { childId, loading: resolving } = useActiveChildId()
  const [rows, setRows] = useState([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async (options = {}) => {
    const { soft = false } = options
    if (!childId) {
      setRows([])
      setAssignmentsLoading(false)
      setError(null)
      return
    }
    if (!soft) setAssignmentsLoading(true)
    setError(null)
    const { data: assigns, error: asErr } = await supabase
      .from('exercise_assignments')
      .select('id, child_id, exercise_id, reps, rep_unit, created_at, schedule_days')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })

    if (asErr) {
      setRows([])
      setError(asErr)
      setAssignmentsLoading(false)
      return
    }

    const today = new Date()
    const dayStart = startOfDayLocal(today)
    const dayEnd = addDaysLocal(dayStart, 1)
    const assignmentRows = toArray(assigns).filter((a) => isAssignmentScheduledOnDate(a, today))
    const exerciseIds = Array.from(new Set(assignmentRows.map((r) => r?.exercise_id).filter(Boolean)))

    let doneByExerciseId = new Set()
    if (exerciseIds.length > 0) {
      const { data: sessRows, error: sessErr } = await supabase
        .from('exercise_sessions')
        .select('exercise_id, success')
        .eq('child_id', childId)
        .in('exercise_id', exerciseIds)
        .eq('success', true)
        .gte('completed_at', dayStart.toISOString())
        .lt('completed_at', dayEnd.toISOString())

      if (sessErr) {
        setRows([])
        setError(sessErr)
        setAssignmentsLoading(false)
        return
      }

      doneByExerciseId = new Set(toArray(sessRows).map((r) => r?.exercise_id).filter(Boolean))
    }

    let exercisesById = new Map()
    if (exerciseIds.length > 0) {
      const { data: exRows, error: exErr } = await supabase
        .from('exercises')
        .select(`${EXERCISE_THUMBNAIL_SELECT}, difficulty, reps`)
        .in('id', exerciseIds)

      if (exErr) {
        setRows([])
        setError(exErr)
        setAssignmentsLoading(false)
        return
      }
      exercisesById = new Map(toArray(exRows).map((r) => [r.id, r]))
    }

    const mapped = assignmentRows
      .map((a) => {
        const ex = exercisesById.get(a.exercise_id)
        if (!ex) return null
        const norm = normalizeExerciseRow(ex)
        return {
          id: ex.id,
          assignmentId: a.id,
          title: norm.title,
          category: norm.category,
          categoryClass: categoryToneClasses(norm.categoryTone),
          difficulty: norm.difficulty,
          reps: formatRepsLine(a, ex),
          thumbnailUrl: norm.imageUrl,
          description: ex.description ?? undefined,
          media_url: ex.media_url ?? undefined,
          done: doneByExerciseId.has(ex.id),
        }
      })
      .filter(Boolean)

    setRows(mapped)
    setAssignmentsLoading(false)
  }, [childId])

  useEffect(() => {
    if (resolving) return
    void refetch()
  }, [resolving, refetch])

  const busy = resolving || assignmentsLoading

  return { exercises: rows, loading: busy, error, refetch, childResolved: Boolean(childId) }
}
