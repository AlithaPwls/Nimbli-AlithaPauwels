/** Matches `public.practices.plan` check constraint */
export type PracticePlanDb = 'free' | 'pro'

export const DEFAULT_COUNTRY = 'België'

export type KinePracticeRegistrationState = {
  plan: PracticePlanDb
  name: string
  phone: string
  email_general: string
  email_invoice: string
  kvk_number: string
  vat_number: string
  street: string
  street_number: string
  city: string
  postal_code: string
  country: string
  invoice_same_as_practice: boolean
  invoice_name: string
  invoice_street: string
  invoice_street_number: string
  invoice_city: string
  invoice_postal_code: string
  invoice_country: string
  simulatedPaymentConfirmed: boolean
  kineFirstname: string
  kineLastname: string
  kineEmail: string
  kinePassword: string
  kineRepeatPassword: string
  termsAccepted: boolean
}

export function initialKinePracticeForm(): KinePracticeRegistrationState {
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
