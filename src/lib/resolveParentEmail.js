import supabase from '@/lib/supabaseClient.js'

export async function resolveParentEmail({ role, profile }) {
  if (role === 'parent') {
    return profile?.email?.trim() || null
  }

  if (role !== 'child' || !profile?.id) return null

  const { data: relRow, error: relErr } = await supabase
    .from('child_parent_relations')
    .select('parent:profiles!parent_id ( email )')
    .eq('child_id', profile.id)
    .limit(1)
    .maybeSingle()

  if (relErr) throw relErr

  const fromRelation = relRow?.parent?.email?.trim()
  if (fromRelation) return fromRelation

  if (!profile?.invite_code) return null

  const { data: parentRow, error: pErr } = await supabase
    .from('profiles')
    .select('email')
    .eq('invite_code', profile.invite_code)
    .eq('role', 'parent')
    .limit(1)
    .maybeSingle()

  if (pErr) throw pErr
  return parentRow?.email?.trim() ?? null
}

export async function verifyParentPassword({ role, profile, password }) {
  const pwd = String(password ?? '').trim()
  if (!pwd) {
    throw new Error('Vul je wachtwoord in.')
  }

  const parentEmail = await resolveParentEmail({ role, profile })
  if (!parentEmail) {
    throw new Error('Ouder-e-mailadres niet gevonden.')
  }

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: parentEmail,
    password: pwd,
  })
  if (signInErr) throw signInErr
}
