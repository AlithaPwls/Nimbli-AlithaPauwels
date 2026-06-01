// Edge Function: delete-kine-team-member
// Verwijdert een collega-kinesist (profiel + Auth) binnen dezelfde praktijk.

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

  if (caller.id === kineId) {
    return jsonResponse({ error: 'cannot_delete_self' }, { status: 400 })
  }

  const { data: target, error: targetErr } = await admin
    .from('profiles')
    .select('id, user_id, practice_id, role')
    .eq('id', kineId)
    .eq('role', 'kine')
    .maybeSingle()

  if (targetErr || !target?.id) {
    return jsonResponse({ error: 'not_found' }, { status: 404 })
  }

  if (target.practice_id !== caller.practice_id) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }

  const authUserId = target.user_id

  const { error: delProfileErr } = await admin.from('profiles').delete().eq('id', target.id)
  if (delProfileErr) {
    return jsonResponse(
      { error: 'delete_failed', details: delProfileErr.message },
      { status: 500 },
    )
  }

  if (authUserId) {
    const { error: authDelErr } = await admin.auth.admin.deleteUser(authUserId)
    if (authDelErr) {
      return jsonResponse(
        { error: 'delete_failed', details: authDelErr.message },
        { status: 500 },
      )
    }
  }

  return jsonResponse({ ok: true })
})
