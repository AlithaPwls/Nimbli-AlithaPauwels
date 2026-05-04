import { useCallback, useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useAuth } from '@/hooks/useAuth.js'
import { categoryToneClasses, normalizeExerciseRow } from '@/lib/exerciseDisplay.js'

function toArray(v) {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

function formatRepsLine(assignment, exerciseRow) {
  const n = assignment?.reps
  if (typeof n === 'number' && Number.isFinite(n)) {
    const u = (assignment?.rep_unit || '').trim()
    if (u) return `${n} ${u}`
    return `${n} herhalingen`
  }
  const norm = normalizeExerciseRow(exerciseRow)
  if (typeof norm.reps === 'number' && Number.isFinite(norm.reps)) {
    return `${norm.reps} herhalingen`
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
  const { role, profile } = useAuth()
  const [childId, setChildId] = useState(null)
  const [resolving, setResolving] = useState(true)
  const [rows, setRows] = useState([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function resolveChild() {
      if (!profile?.id) {
        setChildId(null)
        setResolving(false)
        return
      }
      if (role === 'child') {
        setChildId(profile.id)
        setResolving(false)
        return
      }
      if (role === 'parent' && profile.invite_code) {
        const { data, error: qErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('invite_code', profile.invite_code)
          .eq('role', 'child')
          .limit(1)
          .maybeSingle()
        if (cancelled) return
        if (qErr) {
          setChildId(null)
          setResolving(false)
          return
        }
        setChildId(data?.id ?? null)
        setResolving(false)
        return
      }
      setChildId(null)
      setResolving(false)
    }

    void resolveChild()
    return () => {
      cancelled = true
    }
  }, [role, profile?.id, profile?.invite_code])

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
      .select('id, child_id, exercise_id, reps, rep_unit, created_at')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })

    if (asErr) {
      setRows([])
      setError(asErr)
      setAssignmentsLoading(false)
      return
    }

    const assignmentRows = toArray(assigns)
    const exerciseIds = Array.from(new Set(assignmentRows.map((r) => r?.exercise_id).filter(Boolean)))

    let exercisesById = new Map()
    if (exerciseIds.length > 0) {
      const { data: exRows, error: exErr } = await supabase
        .from('exercises')
        .select(
          'id, title, name, description, duration_seconds, difficulty, focus, media_url, thumbnail_url, reps'
        )
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
          image: norm.imageUrl,
          description: ex.description ?? undefined,
          media_url: ex.media_url ?? undefined,
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
