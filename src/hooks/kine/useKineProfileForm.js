import { useCallback, useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useAuth } from '@/hooks/useAuth.js'

function splitFullName(fullName) {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstname: '', lastname: '' }
  const space = trimmed.indexOf(' ')
  if (space === -1) return { firstname: trimmed, lastname: '' }
  return {
    firstname: trimmed.slice(0, space),
    lastname: trimmed.slice(space + 1).trim(),
  }
}

function toDateInputValue(dateOfBirth) {
  if (!dateOfBirth) return ''
  const isoDate = String(dateOfBirth).trim().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate
  const d = new Date(dateOfBirth)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function profileToForm(profile, practice) {
  const first = profile?.firstname?.trim() ?? ''
  const last = profile?.lastname?.trim() ?? ''
  return {
    fullName: [first, last].filter(Boolean).join(' '),
    email: profile?.email?.trim() ?? '',
    phone: practice?.phone?.trim() ?? '',
    address: profile?.address?.trim() ?? '',
    dateOfBirth: toDateInputValue(profile?.date_of_birth),
    password: '',
  }
}

export function useKineProfileForm() {
  const { profile, loading: authLoading, refreshProfile } = useAuth()
  const [practice, setPractice] = useState(null)
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [form, setForm] = useState(() => profileToForm(null, null))
  const [baseline, setBaseline] = useState(() => profileToForm(null, null))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedMessage, setSavedMessage] = useState(null)

  useEffect(() => {
    if (!profile?.practice_id) {
      setPractice(null)
      setPracticeLoading(false)
      if (profile) {
        const next = profileToForm(profile, null)
        setForm(next)
        setBaseline(next)
      }
      return
    }

    let cancelled = false
    setPracticeLoading(true)

    void (async () => {
      const { data, error: practiceError } = await supabase
        .from('practices')
        .select('id, phone')
        .eq('id', profile.practice_id)
        .maybeSingle()

      if (cancelled) return

      if (practiceError) {
        setPractice(null)
      } else {
        setPractice(data ?? null)
      }

      const next = profileToForm(profile, practiceError ? null : data)
      setForm(next)
      setBaseline(next)
      setError(null)
      setSavedMessage(null)
      setPracticeLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [profile])

  const updateField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError(null)
    setSavedMessage(null)
  }, [])

  const reset = useCallback(() => {
    setForm(baseline)
    setError(null)
    setSavedMessage(null)
  }, [baseline])

  const isDirty = useMemo(() => {
    const keys = ['fullName', 'email', 'phone', 'address', 'dateOfBirth', 'password']
    return keys.some((key) => form[key] !== baseline[key])
  }, [form, baseline])

  const save = useCallback(async () => {
    if (!profile?.id) return { ok: false, message: 'Profiel niet gevonden.' }

    const { firstname, lastname } = splitFullName(form.fullName)
    if (!firstname.trim()) {
      return { ok: false, message: 'Vul je voor- en achternaam in.' }
    }
    if (!form.email.trim()) {
      return { ok: false, message: 'Vul je e-mailadres in.' }
    }
    if (form.password && form.password.length < 8) {
      return { ok: false, message: 'Wachtwoord moet minstens 8 tekens zijn.' }
    }

    setSaving(true)
    setError(null)
    setSavedMessage(null)

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: form.email.trim(),
          address: form.address.trim() || null,
          date_of_birth: form.dateOfBirth || null,
        })
        .eq('id', profile.id)

      if (profileError) {
        return { ok: false, message: 'Profiel opslaan mislukt. Probeer opnieuw.' }
      }

      if (profile.practice_id) {
        const phone = form.phone.trim() || null
        const baselinePhone = baseline.phone.trim() || null
        if (phone !== baselinePhone) {
          const { error: practiceError } = await supabase
            .from('practices')
            .update({ phone })
            .eq('id', profile.practice_id)

          if (practiceError) {
            return { ok: false, message: 'Telefoonnummer opslaan mislukt. Probeer opnieuw.' }
          }
          setPractice((current) => (current ? { ...current, phone } : { id: profile.practice_id, phone }))
        }
      }

      const authUpdates = {}
      if (form.email.trim() !== (profile.email?.trim() ?? '')) {
        authUpdates.email = form.email.trim()
      }
      if (form.password) {
        authUpdates.password = form.password
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates)
        if (authError) {
          return {
            ok: false,
            message: authError.message || 'Accountgegevens bijwerken mislukt.',
          }
        }
      }

      await refreshProfile()
      const nextBaseline = profileToForm(
        {
          ...profile,
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: form.email.trim(),
          address: form.address.trim() || null,
          date_of_birth: form.dateOfBirth || null,
        },
        practice ? { ...practice, phone: form.phone.trim() || null } : null
      )
      setBaseline(nextBaseline)
      setForm(nextBaseline)
      setSavedMessage('Je wijzigingen zijn opgeslagen.')
      return { ok: true }
    } finally {
      setSaving(false)
    }
  }, [form, profile, baseline.phone, refreshProfile])

  return {
    profile,
    practice,
    loading: authLoading || practiceLoading,
    form,
    updateField,
    reset,
    save,
    saving,
    error,
    setError,
    savedMessage,
    isDirty,
  }
}
