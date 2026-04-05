import type { KinePracticeRegistrationState } from '@/types/practice-registration'

export type PracticeInsertRow = {
  name: string
  phone: string | null
  email_general: string | null
  email_invoice: string | null
  kvk_number: string | null
  vat_number: string | null
  street: string | null
  street_number: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  invoice_same_as_practice: boolean
  invoice_name: string | null
  invoice_street: string | null
  invoice_street_number: string | null
  invoice_city: string | null
  invoice_postal_code: string | null
  invoice_country: string | null
  plan: 'free' | 'pro'
  plan_started_at: string
}

function emptyToNull(s: string): string | null {
  const t = s.trim()
  return t === '' ? null : t
}

export function buildPracticeInsert(form: KinePracticeRegistrationState): PracticeInsertRow {
  const isFree = form.plan === 'free'
  const same = isFree ? true : form.invoice_same_as_practice
  return {
    name: form.name.trim(),
    phone: emptyToNull(form.phone),
    email_general: emptyToNull(form.email_general),
    email_invoice: isFree ? null : emptyToNull(form.email_invoice),
    kvk_number: isFree ? null : emptyToNull(form.kvk_number),
    vat_number: isFree ? null : emptyToNull(form.vat_number),
    street: emptyToNull(form.street),
    street_number: emptyToNull(form.street_number),
    city: emptyToNull(form.city),
    postal_code: emptyToNull(form.postal_code),
    country: emptyToNull(form.country) ?? 'België',
    invoice_same_as_practice: same,
    invoice_name: same ? null : emptyToNull(form.invoice_name),
    invoice_street: same ? null : emptyToNull(form.invoice_street),
    invoice_street_number: same ? null : emptyToNull(form.invoice_street_number),
    invoice_city: same ? null : emptyToNull(form.invoice_city),
    invoice_postal_code: same ? null : emptyToNull(form.invoice_postal_code),
    invoice_country: same ? null : emptyToNull(form.invoice_country),
    plan: form.plan,
    plan_started_at: new Date().toISOString(),
  }
}
