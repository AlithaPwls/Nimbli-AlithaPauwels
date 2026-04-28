export const DEFAULT_COUNTRY = 'België'

export function initialKinePracticeForm() {
  return {
    plan: 'free',
    name: '',
    phone: '',
    email_general: '',
    email_invoice: '',
    kvk_number: '',
    vat_number: '',
    street: '',
    street_number: '',
    city: '',
    postal_code: '',
    country: DEFAULT_COUNTRY,
    invoice_same_as_practice: true,
    invoice_name: '',
    invoice_street: '',
    invoice_street_number: '',
    invoice_city: '',
    invoice_postal_code: '',
    invoice_country: '',
    simulatedPaymentConfirmed: false,
    kineFirstname: '',
    kineLastname: '',
    kineEmail: '',
    kinePassword: '',
    kineRepeatPassword: '',
    termsAccepted: false,
  }
}

