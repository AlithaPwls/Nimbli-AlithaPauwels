import { useCallback, useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { useAuth } from '@/hooks/useAuth.js'
import { parseIsoDateLocal } from '@/lib/dateInput.js'

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

function profileToForm(profile) {
  const first = profile?.firstname?.trim() ?? ''
  const last = profile?.lastname?.trim() ?? ''
  return {
    fullName: [first, last].filter(Boolean).join(' '),
    email: profile?.email?.trim() ?? '',
    phone: profile?.phone_number?.trim() ?? '',
    address: profile?.address?.trim() ?? '',
    dateOfBirth: toDateInputValue(profile?.date_of_birth),
    password: '',
  }
}

export function useParentProfileForm() {
  const { profile, loading: authLoading, refreshProfile } = useAuth()
  const [form, setForm] = useState(() => profileToForm(null))
  const [baseline, setBaseline] = useState(() => profileToForm(null))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedMessage, setSavedMessage] = useState(null)

  useEffect(() => {
    if (!profile) return
    const next = profileToForm(profile)
    setForm(next)
    setBaseline(next)
    setError(null)
    setSavedMessage(null)
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
    if (profile.role !== 'parent') {
      return { ok: false, message: 'Alleen ouderprofielen kunnen hier worden bewerkt.' }
    }

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

    if (form.dateOfBirth) {
      const dob = parseIsoDateLocal(form.dateOfBirth)
      if (!dob) {
        return { ok: false, message: 'Vul een geldige geboortedatum in.' }
      }
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (dob > today) {
        return { ok: false, message: 'Geboortedatum kan niet in de toekomst liggen.' }
      }
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
          phone_number: form.phone.trim() || null,
          address: form.address.trim() || null,
          date_of_birth: form.dateOfBirth || null,
        })
        .eq('id', profile.id)

      if (profileError) {
        return { ok: false, message: 'Profiel opslaan mislukt. Probeer opnieuw.' }
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
      const nextBaseline = profileToForm({
        ...profile,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: form.email.trim(),
        phone_number: form.phone.trim() || null,
        address: form.address.trim() || null,
        date_of_birth: form.dateOfBirth || null,
      })
      setBaseline(nextBaseline)
      setForm({ ...nextBaseline, password: '' })
      setSavedMessage('Je wijzigingen zijn opgeslagen.')
      return { ok: true }
    } finally {
      setSaving(false)
    }
  }, [form, profile, refreshProfile])

  return {
    profile,
    loading: authLoading,
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
