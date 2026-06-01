// Edge Function: update-kine-team-member
// Werkt profiel + Auth van een collega-kinesist bij binnen dezelfde praktijk.

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: { get: (key: string) => string | undefined }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts'
import { getCallerKine, isUuid } from '../_shared/kineCaller.ts'

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

function requiredText(value: unknown) {
  const text = String(value ?? '').trim()
  return text === '' ? '' : text
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

  const kineId = body.kineId
  if (!isUuid(kineId)) {
    return jsonResponse(
      { error: 'invalid_payload', details: 'kineId (uuid) is required.' },
      { status: 400 },
    )
  }

  const firstname = requiredText(body.firstname)
  const lastname = requiredText(body.lastname)
  const dateOfBirthRaw = requiredText(body.date_of_birth)
  const date_of_birth = dateOfBirthRaw ? dateOfBirthRaw : null
  const email = requiredText(body.email)
  const password = String(body.password ?? '')

  if (!firstname || !lastname) {
    return jsonResponse({ error: 'name_required' }, { status: 400 })
  }
  if (date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
    return jsonResponse({ error: 'invalid_birthdate' }, { status: 400 })
  }
  if (!email || !email.includes('@')) {
    return jsonResponse({ error: 'invalid_email' }, { status: 400 })
  }
  if (password && password.length < 8) {
    return jsonResponse({ error: 'password_too_short' }, { status: 400 })
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

  const caller = await getCallerKine(admin, user.id)
  if (!caller) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }

  const { data: target, error: targetErr } = await admin
    .from('profiles')
    .select('id, user_id, practice_id, role, email')
    .eq('id', kineId)
    .eq('role', 'kine')
    .maybeSingle()

  if (targetErr || !target?.id) {
    return jsonResponse({ error: 'not_found' }, { status: 404 })
  }

  if (target.practice_id !== caller.practice_id) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      firstname,
      lastname,
      email,
      date_of_birth,
    })
    .eq('id', target.id)

  if (profileErr) {
    return jsonResponse(
      { error: 'update_failed', details: profileErr.message },
      { status: 500 },
    )
  }

  const authUserId = target.user_id
  if (authUserId) {
    const authUpdates: { email?: string; password?: string } = {}
    if (email !== (target.email?.trim() ?? '')) {
      authUpdates.email = email
    }
    if (password) {
      authUpdates.password = password
    }
    if (Object.keys(authUpdates).length > 0) {
      const { error: authErr } = await admin.auth.admin.updateUserById(authUserId, authUpdates)
      if (authErr) {
        return jsonResponse(
          { error: 'auth_update_failed', details: authErr.message },
          { status: 500 },
        )
      }
    }
  }

  return jsonResponse({ ok: true })
})
