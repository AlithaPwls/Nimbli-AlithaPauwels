// Edge Function: delete-kine-patient
// Verwijdert precies één kind-profiel (+ diens Auth indien geregistreerd).
// Ouder wordt alleen verwijderd als er geen ander gekoppeld kind meer is.

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

function postgresErrorText(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return String(err ?? '')
  }
  const row = err as Record<string, unknown>
  return [row.message, row.details, row.hint, row.code]
    .filter((part) => part != null && String(part).trim() !== '')
    .map(String)
    .join(' ')
}

function inviteCodeVariants(code: string | null | undefined): string[] {
  const inv = code?.trim()
  if (!inv) return []
  const digits = inv.replace(/\D/g, '')
  if (digits.length === 6) {
    const plain = digits
    const dashed = `${digits.slice(0, 3)}-${digits.slice(3)}`
    return [...new Set([inv, plain, dashed])]
  }
  return [inv]
}

type ParentRef = {
  id: string
  user_id: string | null
  invite_code: string | null
}

/**
 * True when another child is still linked to this parent (relations and/or legacy invite_code).
 * Must run BEFORE the target child profile is deleted.
 * (Filter siblings in code — PostgREST .neq on child_id is unreliable here.)
 */
async function hasOtherChildrenLinked(
  admin: ReturnType<typeof createClient>,
  parent: ParentRef,
  practiceId: string,
  excludeChildId: string,
): Promise<boolean> {
  const { data: relRows, error: relErr } = await admin
    .from('child_parent_relations')
    .select('child_id')
    .eq('parent_id', parent.id)

  if (relErr) {
    throw new Error(relErr.message)
  }

  const siblingIds = (Array.isArray(relRows) ? relRows : [])
    .map((r) => r?.child_id)
    .filter((id): id is string => Boolean(id) && id !== excludeChildId)

  if (siblingIds.length > 0) {
    const { count, error: sibErr } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'child')
      .eq('practice_id', practiceId)
      .in('id', siblingIds)

    if (sibErr) {
      throw new Error(sibErr.message)
    }
    if ((count ?? 0) > 0) {
      return true
    }
  }

  const codes = inviteCodeVariants(parent.invite_code)
  if (codes.length === 0) {
    return false
  }

  const { data: legacyRows, error: invErr } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'child')
    .eq('practice_id', practiceId)
    .in('invite_code', codes)

  if (invErr) {
    throw new Error(invErr.message)
  }

  return (Array.isArray(legacyRows) ? legacyRows : []).some(
    (row) => row?.id && row.id !== excludeChildId,
  )
}

async function resolveParentForChild(
  admin: ReturnType<typeof createClient>,
  childId: string,
  childInviteCode: string | null,
  practiceId: string,
): Promise<ParentRef | null> {
  const { data: rel } = await admin
    .from('child_parent_relations')
    .select('parent_id')
    .eq('child_id', childId)
    .limit(1)
    .maybeSingle()

  if (rel?.parent_id) {
    const { data: parentRow } = await admin
      .from('profiles')
      .select('id, user_id, practice_id, role, invite_code')
      .eq('id', rel.parent_id)
      .eq('role', 'parent')
      .maybeSingle()

    if (parentRow?.id && parentRow.practice_id === practiceId) {
      return {
        id: parentRow.id,
        user_id: parentRow.user_id ?? null,
        invite_code: parentRow.invite_code ?? null,
      }
    }
  }

  const childCodes = inviteCodeVariants(childInviteCode)
  if (childCodes.length === 0) {
    return null
  }

  const { data: parentRow } = await admin
    .from('profiles')
    .select('id, user_id, practice_id, role, invite_code')
    .eq('role', 'parent')
    .eq('practice_id', practiceId)
    .in('invite_code', childCodes)
    .limit(1)
    .maybeSingle()

  if (!parentRow?.id) {
    return null
  }

  return {
    id: parentRow.id,
    user_id: parentRow.user_id ?? null,
    invite_code: parentRow.invite_code ?? null,
  }
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

  const practiceId = kine.practice_id

  const { data: child, error: childErr } = await admin
    .from('profiles')
    .select('id, user_id, practice_id, role, invite_code')
    .eq('id', childId)
    .eq('role', 'child')
    .maybeSingle()

  if (childErr || !child?.id) {
    return jsonResponse({ error: 'not_found' }, { status: 404 })
  }

  if (child.practice_id !== practiceId) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }

  const childAuthId = child.user_id ?? null
  const deletedChildProfileId = child.id

  let parent: ParentRef | null = null
  let deleteParentToo = false
  let hasOtherChildren = false

  try {
    parent = await resolveParentForChild(
      admin,
      deletedChildProfileId,
      child.invite_code ?? null,
      practiceId,
    )

    if (parent?.id) {
      hasOtherChildren = await hasOtherChildrenLinked(
        admin,
        parent,
        practiceId,
        deletedChildProfileId,
      )
      deleteParentToo = !hasOtherChildren
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: 'delete_failed', details: msg }, { status: 500 })
  }

  const { error: delChildErr } = await admin
    .from('profiles')
    .delete()
    .eq('id', deletedChildProfileId)
    .eq('role', 'child')

  if (delChildErr) {
    return jsonResponse(
      { error: 'delete_failed', details: delChildErr.message },
      { status: 500 },
    )
  }

  // Vanaf hier is het kindprofiel weg — altijd ok:true teruggeven (geen 500 meer).
  const warnings: string[] = []
  let deletedParent = false

  if (deleteParentToo && parent?.id && !hasOtherChildren) {
    const { error: delParentErr } = await admin
      .from('profiles')
      .delete()
      .eq('id', parent.id)
      .eq('role', 'parent')

    if (delParentErr) {
      const errText = postgresErrorText(delParentErr)
      warnings.push(errText || 'Ouderprofiel niet verwijderd.')
      if (errText.includes('parent_profile_has_linked_children')) {
        hasOtherChildren = true
      }
    } else {
      deletedParent = true
    }
  }

  const authIds = new Set<string>()
  if (childAuthId) {
    authIds.add(childAuthId)
  }
  if (deletedParent && parent?.user_id && parent.user_id !== childAuthId) {
    authIds.add(parent.user_id)
  }

  let deletedAuthCount = 0

  for (const authId of authIds) {
    const { error: authDelErr } = await admin.auth.admin.deleteUser(authId)
    if (authDelErr) {
      warnings.push(postgresErrorText(authDelErr) || String(authDelErr))
      continue
    }
    deletedAuthCount += 1
  }

  return jsonResponse({
    ok: true,
    deletedChildProfileId,
    deletedAuthAccounts: deletedAuthCount,
    deletedParent,
    hasOtherChildrenForParent: hasOtherChildren,
    warnings: warnings.length > 0 ? warnings : undefined,
  })
})
