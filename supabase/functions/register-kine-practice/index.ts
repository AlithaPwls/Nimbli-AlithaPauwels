// Edge Function: register-kine-practice
// Public self-registration for a kinesist practice. Uses the service role so this
// stays compatible with Auth email confirmation and does not require anon RLS writes.

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: { get: (key: string) => string | undefined }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts'

type Plan = 'free' | 'pro'

type PracticeInsert = {
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
  country: string
  invoice_same_as_practice: boolean
  invoice_name: string | null
  invoice_street: string | null
  invoice_street_number: string | null
  invoice_city: string | null
  invoice_postal_code: string | null
  invoice_country: string | null
  plan: Plan
  plan_started_at: string
}

type KineInput = {
  firstname: string
  lastname: string
  email: string
  password: string
}

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function textOrNull(value: unknown) {
  const text = String(value ?? '').trim()
  return text === '' ? null : text
}

function requiredText(value: unknown) {
  return textOrNull(value) ?? ''
}

function normalizePractice(value: unknown): { practice: PracticeInsert | null; error?: string } {
  const input = asRecord(value)
  const name = requiredText(input.name)
  const plan = input.plan === 'pro' || input.plan === 'free' ? input.plan : null

  if (!name) return { practice: null, error: 'practice_name_required' }
  if (!plan) return { practice: null, error: 'invalid_plan' }

  const isFree = plan === 'free'
  const invoiceSameAsPractice = isFree ? true : Boolean(input.invoice_same_as_practice)

  if (!isFree && !invoiceSameAsPractice && !textOrNull(input.invoice_name)) {
    return { practice: null, error: 'invoice_name_required' }
  }

  return {
    practice: {
      name,
      phone: textOrNull(input.phone),
      email_general: textOrNull(input.email_general),
      email_invoice: isFree ? null : textOrNull(input.email_invoice),
      kvk_number: isFree ? null : textOrNull(input.kvk_number),
      vat_number: isFree ? null : textOrNull(input.vat_number),
      street: textOrNull(input.street),
      street_number: textOrNull(input.street_number),
      city: textOrNull(input.city),
      postal_code: textOrNull(input.postal_code),
      country: textOrNull(input.country) ?? 'België',
      invoice_same_as_practice: invoiceSameAsPractice,
      invoice_name: invoiceSameAsPractice ? null : textOrNull(input.invoice_name),
      invoice_street: invoiceSameAsPractice ? null : textOrNull(input.invoice_street),
      invoice_street_number: invoiceSameAsPractice ? null : textOrNull(input.invoice_street_number),
      invoice_city: invoiceSameAsPractice ? null : textOrNull(input.invoice_city),
      invoice_postal_code: invoiceSameAsPractice ? null : textOrNull(input.invoice_postal_code),
      invoice_country: invoiceSameAsPractice ? null : textOrNull(input.invoice_country),
      plan,
      plan_started_at: new Date().toISOString(),
    },
  }
}

function normalizeKine(value: unknown): { kine: KineInput | null; error?: string } {
  const input = asRecord(value)
  const firstname = requiredText(input.firstname)
  const lastname = requiredText(input.lastname)
  const email = requiredText(input.email)
  const password = String(input.password ?? '')

  if (!firstname || !lastname) return { kine: null, error: 'name_required' }
  if (!email || !email.includes('@')) return { kine: null, error: 'invalid_email' }
  if (password.length < 8) return { kine: null, error: 'password_too_short' }

  return { kine: { firstname, lastname, email, password } }
}

function authErrorStatus(errorMessage: string) {
  const message = errorMessage.toLowerCase()
  if (
    message.includes('already') ||
    message.includes('registered') ||
    message.includes('exists') ||
    message.includes('duplicate')
  ) {
    return 409
  }
  return 400
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'server_misconfigured' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = asRecord(await req.json())
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400 })
  }

  const { practice, error: practiceError } = normalizePractice(body.practice)
  if (!practice) {
    return jsonResponse({ error: 'invalid_payload', details: practiceError }, { status: 400 })
  }

  const { kine, error: kineError } = normalizeKine(body.kine)
  if (!kine) {
    return jsonResponse({ error: 'invalid_payload', details: kineError }, { status: 400 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: createUserErr } = await admin.auth.admin.createUser({
    email: kine.email,
    password: kine.password,
    email_confirm: true,
  })

  if (createUserErr || !authData.user?.id) {
    const message = createUserErr?.message ?? 'Auth account could not be created.'
    return jsonResponse(
      { error: 'auth_create_failed', details: message },
      { status: authErrorStatus(message) },
    )
  }

  const userId = authData.user.id
  let practiceId: string | null = null

  const cleanup = async () => {
    if (practiceId) {
      await admin.from('practices').delete().eq('id', practiceId)
    }
    await admin.auth.admin.deleteUser(userId)
  }

  const { data: practiceRow, error: practiceInsertErr } = await admin
    .from('practices')
    .insert(practice)
    .select('id')
    .single()

  if (practiceInsertErr || !practiceRow?.id) {
    await cleanup()
    return jsonResponse(
      {
        error: 'practice_create_failed',
        details: practiceInsertErr?.message ?? 'Practice could not be created.',
      },
      { status: 500 },
    )
  }

  practiceId = practiceRow.id

  const { error: profileInsertErr } = await admin.from('profiles').insert({
    id: userId,
    firstname: kine.firstname,
    lastname: kine.lastname,
    email: kine.email,
    role: 'kine',
    user_id: userId,
    practice_id: practiceId,
  })

  if (profileInsertErr) {
    await cleanup()
    return jsonResponse(
      { error: 'profile_create_failed', details: profileInsertErr.message },
      { status: 500 },
    )
  }

  return jsonResponse({ ok: true })
})
