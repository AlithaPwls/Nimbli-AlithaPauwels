import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'
import { buildPracticeInsert } from '@/lib/buildPracticeInsert'
import type { KinePracticeRegistrationState } from '@/types/practice-registration'

const MIN_PASSWORD = 8

export type KineRegistrationMode = 'new_kine' | 'existing_session'

function validateSubmit(
  form: KinePracticeRegistrationState,
  mode: KineRegistrationMode
): string | null {
  if (!form.name.trim()) return 'Vul de naam van je praktijk in.'
  if (form.plan === 'pro' && !form.simulatedPaymentConfirmed) {
    return 'Bevestig de demo-betaling om verder te gaan.'
  }
  if (mode === 'new_kine') {
    if (!form.kineFirstname.trim() || !form.kineLastname.trim()) {
      return 'Vul je voor- en achternaam in.'
    }
    if (!form.kineEmail.trim()) return 'Vul je e-mailadres in.'
    if (form.kinePassword.length < MIN_PASSWORD) {
      return `Wachtwoord moet minstens ${MIN_PASSWORD} tekens zijn.`
    }
    if (form.kinePassword !== form.kineRepeatPassword) {
      return 'Wachtwoorden komen niet overeen.'
    }
    if (!form.termsAccepted) return 'Ga akkoord met de voorwaarden.'
  }
  if (
    form.plan === 'pro' &&
    !form.invoice_same_as_practice &&
    !form.invoice_name.trim()
  ) {
    return 'Vul de factuurnaam in.'
  }
  return null
}

export function useKinePracticeRegistration() {
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(
    async (
      form: KinePracticeRegistrationState,
      mode: KineRegistrationMode,
      authUserId: string | null
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      const err = validateSubmit(form, mode)
      if (err) return { ok: false, message: err }

      setSubmitting(true)
      try {
        const row = buildPracticeInsert(form)

        if (mode === 'new_kine') {
          const email = form.kineEmail.trim()
          const { data: signUpData, error: signErr } = await supabase.auth.signUp({
            email,
            password: form.kinePassword,
          })
          if (signErr) {
            return {
              ok: false,
              message: signErr.message.toLowerCase().includes('already')
                ? 'Dit e-mailadres is al geregistreerd.'
                : 'Registratie mislukt. Probeer opnieuw.',
            }
          }
          const uid = signUpData.user?.id
          if (!uid) {
            return {
              ok: false,
              message:
                'Account niet volledig aangemaakt. Controleer je e-mail of probeer opnieuw.',
            }
          }

          const { data: practiceRow, error: prErr } = await supabase
            .from('practices')
            .insert(row)
            .select('id')
            .single()

          if (prErr || !practiceRow) {
            return { ok: false, message: 'Praktijk aanmaken mislukt. Probeer later opnieuw.' }
          }

          const { error: insProf } = await supabase.from('profiles').insert({
            id: uid,
            firstname: form.kineFirstname.trim(),
            lastname: form.kineLastname.trim(),
            email,
            role: 'kine',
            user_id: uid,
            practice_id: practiceRow.id,
          })

          if (insProf) {
            return { ok: false, message: 'Profiel aanmaken mislukt. Neem contact op met support.' }
          }

          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password: form.kinePassword,
          })
          if (signInErr) {
            return {
              ok: false,
              message: 'Praktijk is aangemaakt. Log in met je e-mail en wachtwoord.',
            }
          }

          return { ok: true }
        }

        if (!authUserId) {
          return { ok: false, message: 'Je bent niet ingelogd.' }
        }

        const { data: practiceRow, error: prErr } = await supabase
          .from('practices')
          .insert(row)
          .select('id')
          .single()

        if (prErr || !practiceRow) {
          return { ok: false, message: 'Praktijk aanmaken mislukt. Probeer later opnieuw.' }
        }

        const { error: upErr } = await supabase
          .from('profiles')
          .update({ practice_id: practiceRow.id })
          .eq('role', 'kine')
          .or(`id.eq.${authUserId},user_id.eq.${authUserId}`)

        if (upErr) {
          return { ok: false, message: 'Praktijk koppelen aan je profiel mislukt.' }
        }

        return { ok: true }
      } catch {
        return { ok: false, message: 'Er ging iets mis. Probeer later opnieuw.' }
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  return { submit, submitting }
}
