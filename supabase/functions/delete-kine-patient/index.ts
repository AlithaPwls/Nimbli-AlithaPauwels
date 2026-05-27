// Edge Function: delete-kine-patient
// Verwijdert kind + gekoppelde ouder (profiles + Auth-accounts) voor de praktijk van de ingelogde kinesist.

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: { get: (key: string) => string | undefined }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts'

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

function isUuid(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  )
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

  const childId = body.childId
  if (!isUuid(childId)) {
    return jsonResponse(
      { error: 'invalid_payload', details: 'childId (uuid) is required.' },
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

  const { data: kine, error: kineErr } = await admin
    .from('profiles')
    .select('id, role, practice_id')
    .eq('user_id', user.id)
    .eq('role', 'kine')
    .maybeSingle()

  if (kineErr || !kine?.practice_id) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }

  const { data: child, error: childErr } = await admin
    .from('profiles')
    .select('id, user_id, practice_id, role')
    .eq('id', childId)
    .eq('role', 'child')
    .maybeSingle()

  if (childErr || !child?.id) {
    return jsonResponse({ error: 'not_found' }, { status: 404 })
  }

  if (child.practice_id !== kine.practice_id) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }

  const { data: rel } = await admin
    .from('child_parent_relations')
    .select('parent_id')
    .eq('child_id', child.id)
    .limit(1)
    .maybeSingle()

  let parent: { id: string; user_id: string | null } | null = null
  if (rel?.parent_id) {
    const { data: parentRow } = await admin
      .from('profiles')
      .select('id, user_id, practice_id, role')
      .eq('id', rel.parent_id)
      .eq('role', 'parent')
      .maybeSingle()

    if (parentRow?.id && parentRow.practice_id === kine.practice_id) {
      parent = { id: parentRow.id, user_id: parentRow.user_id ?? null }
    }
  }

  const authIds = new Set<string>()
  if (child.user_id) authIds.add(child.user_id)
  if (parent?.user_id) authIds.add(parent.user_id)

  const { error: delChildErr } = await admin.from('profiles').delete().eq('id', child.id)
  if (delChildErr) {
    return jsonResponse(
      { error: 'delete_failed', details: delChildErr.message },
      { status: 500 },
    )
  }

  if (parent?.id) {
    const { error: delParentErr } = await admin.from('profiles').delete().eq('id', parent.id)
    if (delParentErr) {
      return jsonResponse(
        { error: 'delete_failed', details: delParentErr.message },
        { status: 500 },
      )
    }
  }

  for (const authId of authIds) {
    const { error: authDelErr } = await admin.auth.admin.deleteUser(authId)
    if (authDelErr) {
      return jsonResponse(
        { error: 'delete_failed', details: authDelErr.message },
        { status: 500 },
      )
    }
  }

  return jsonResponse({ ok: true, deletedAuthAccounts: authIds.size })
})
