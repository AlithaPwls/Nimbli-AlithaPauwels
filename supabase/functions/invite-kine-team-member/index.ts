// Edge Function: invite-kine-team-member
// Maakt een extra kinesist-account aan binnen de praktijk van de ingelogde kinesist.

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: { get: (key: string) => string | undefined }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts'

type KineInput = {
  firstname: string
  lastname: string
  date_of_birth: string | null
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

function requiredText(value: unknown) {
  const text = String(value ?? '').trim()
  return text === '' ? '' : text
}

function normalizeKine(value: unknown): { kine: KineInput | null; error?: string } {
  const input = asRecord(value)
  const firstname = requiredText(input.firstname)
  const lastname = requiredText(input.lastname)
  const dateOfBirthRaw = requiredText(input.date_of_birth)
  const date_of_birth = dateOfBirthRaw ? dateOfBirthRaw : null
  const email = requiredText(input.email)
  const password = String(input.password ?? '')

  if (!firstname || !lastname) return { kine: null, error: 'name_required' }
  if (date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
    return { kine: null, error: 'invalid_birthdate' }
  }
  if (!email || !email.includes('@')) return { kine: null, error: 'invalid_email' }
  if (password.length < 8) return { kine: null, error: 'password_too_short' }

  return { kine: { firstname, lastname, date_of_birth, email, password } }
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

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'server_misconfigured' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400 })
  }

  const { kine, error: kineError } = normalizeKine(body.kine)
  if (!kine) {
    return jsonResponse({ error: 'invalid_payload', details: kineError }, { status: 400 })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()

  if (userErr || !user?.id) {
    return jsonResponse({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: caller, error: callerErr } = await admin
    .from('profiles')
    .select('id, role, practice_id')
    .eq('user_id', user.id)
    .eq('role', 'kine')
    .maybeSingle()

  if (callerErr || !caller?.practice_id) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }

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

  const { error: profileInsertErr } = await admin.from('profiles').insert({
    id: userId,
    firstname: kine.firstname,
    lastname: kine.lastname,
    email: kine.email,
    role: 'kine',
    user_id: userId,
    practice_id: caller.practice_id,
    date_of_birth: kine.date_of_birth,
  })

  if (profileInsertErr) {
    await admin.auth.admin.deleteUser(userId)
    return jsonResponse(
      { error: 'profile_create_failed', details: profileInsertErr.message },
      { status: 500 },
    )
  }

  return jsonResponse({ ok: true })
})
