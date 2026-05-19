import { useCallback, useEffect, useRef, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

function toArray(x) {
  return Array.isArray(x) ? x : []
}

function formatNoteTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapAuthorName(row) {
  if (!row) return 'Onbekend'
  const first = row.firstname?.trim() ?? ''
  const last = row.lastname?.trim() ?? ''
  const name = [first, last].filter(Boolean).join(' ').trim()
  return name || 'Onbekend'
}

function mapNoteRow(row, authorsById) {
  const author = authorsById.get(row.author_id) ?? null
  const createdAt = row.created_at ?? null
  const updatedAt = row.updated_at ?? null
  const wasEdited =
    updatedAt &&
    createdAt &&
    new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 1000

  return {
    id: row.id,
    title: row.title?.trim() || 'Zonder titel',
    content: row.content?.trim() || '',
    authorId: row.author_id ?? null,
    authorName: mapAuthorName(author),
    createdAt,
    createdAtLabel: formatNoteTime(createdAt),
    updatedAt,
    updatedAtLabel: wasEdited ? formatNoteTime(updatedAt) : null,
  }
}

function validateNoteFields(title, content) {
  const t = title?.trim() ?? ''
  const c = content?.trim() ?? ''
  if (!t) return 'Vul een titel in.'
  if (!c) return 'Vul een tekst in.'
  return null
}

/**
 * Patient logbook notes (public.notes) for kine patient detail.
 */
export function usePatientNotes({ patientId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(Boolean(patientId))
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)
  const silentRefetchRef = useRef(false)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const refetch = useCallback((options = {}) => {
    silentRefetchRef.current = Boolean(options.silent)
    setTick((t) => t + 1)
  }, [])

  const clearSaveError = useCallback(() => setSaveError(null), [])
  const clearDeleteError = useCallback(() => setDeleteError(null), [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!patientId) {
        setNotes([])
        setError(null)
        setLoading(false)
        return
      }

      const silent = silentRefetchRef.current
      silentRefetchRef.current = false
      if (!silent) setLoading(true)
      setError(null)

      const { data: noteRows, error: notesErr } = await supabase
        .from('notes')
        .select('id, child_id, author_id, title, content, created_at, updated_at')
        .eq('child_id', patientId)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (notesErr) {
        setNotes([])
        setError(notesErr)
        setLoading(false)
        return
      }

      const rows = toArray(noteRows)
      const authorIds = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean)))

      let authorsById = new Map()
      if (authorIds.length > 0) {
        const { data: authorRows, error: authorErr } = await supabase
          .from('profiles')
          .select('id, firstname, lastname')
          .in('id', authorIds)

        if (cancelled) return

        if (authorErr) {
          setNotes([])
          setError(authorErr)
          setLoading(false)
          return
        }

        authorsById = new Map(toArray(authorRows).map((r) => [r.id, r]))
      }

      setNotes(rows.map((r) => mapNoteRow(r, authorsById)))
      setLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [patientId, tick])

  const createNote = useCallback(
    async ({ childId, authorId, title, content }) => {
      const validation = validateNoteFields(title, content)
      if (validation) {
        setSaveError(validation)
        return { ok: false }
      }

      setSaving(true)
      setSaveError(null)

      const { error: insertErr } = await supabase.from('notes').insert({
        child_id: childId,
        author_id: authorId ?? null,
        title: title.trim(),
        content: content.trim(),
      })

      setSaving(false)

      if (insertErr) {
        setSaveError('Notitie opslaan mislukt. Probeer opnieuw.')
        return { ok: false }
      }

      return { ok: true }
    },
    []
  )

  const updateNote = useCallback(async ({ id, title, content }) => {
    if (!id) {
      setSaveError('Notitie ontbreekt.')
      return { ok: false }
    }

    const validation = validateNoteFields(title, content)
    if (validation) {
      setSaveError(validation)
      return { ok: false }
    }

    setSaving(true)
    setSaveError(null)

    const payload = {
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString(),
    }

    const { error: updateErr } = await supabase.from('notes').update(payload).eq('id', id)

    setSaving(false)

    if (updateErr) {
      setSaveError('Notitie bijwerken mislukt. Probeer opnieuw.')
      return { ok: false }
    }

    return { ok: true }
  }, [])

  const deleteNote = useCallback(async (id) => {
    if (!id) {
      setDeleteError('Notitie ontbreekt.')
      return { ok: false }
    }

    setDeleting(true)
    setDeleteError(null)

    const { error: deleteErr } = await supabase.from('notes').delete().eq('id', id)

    setDeleting(false)

    if (deleteErr) {
      setDeleteError('Notitie verwijderen mislukt. Probeer opnieuw.')
      return { ok: false }
    }

    return { ok: true }
  }, [])

  return {
    notes,
    loading,
    error,
    saving,
    saveError,
    deleting,
    deleteError,
    refetch,
    clearSaveError,
    clearDeleteError,
    createNote,
    updateNote,
    deleteNote,
  }
}
