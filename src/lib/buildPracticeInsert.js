export function buildPracticeInsert(form) {
  const emptyToNull = (s) => {
    const t = String(s ?? '').trim()
    return t === '' ? null : t
  }

  const isFree = form.plan === 'free'
  const same = isFree ? true : Boolean(form.invoice_same_as_practice)
  return {
    name: String(form.name ?? '').trim(),
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

