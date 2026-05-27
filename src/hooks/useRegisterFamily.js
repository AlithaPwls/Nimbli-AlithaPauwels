import supabase from '@/lib/supabaseClient.js'

function childAuthEmail(inviteCode) {
  const digits = String(inviteCode ?? '').replace(/\D/g, '')
  return `kind.${digits || inviteCode}@nimbli.be`
}

/**
 * After failed signUp (duplicate / 422 / validation), try signIn once with the same password.
 * Covers "user already exists" from a previous attempt without brittle message parsing.
 */
async function ensureAuthUser({ email, password }) {
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  })

  if (!signUpErr && signUpData.user?.id) {
    await supabase.auth.signOut()
    return { userId: signUpData.user.id, mode: 'signup' }
  }

  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (!signInErr && signInData.user?.id) {
    await supabase.auth.signOut()
    return { userId: signInData.user.id, mode: 'signin' }
  }

  const primary = String(signUpErr?.message ?? '').toLowerCase()
  if (
    primary.includes('already') ||
    primary.includes('registered') ||
    primary.includes('exists') ||
    primary.includes('duplicate')
  ) {
    return {
      userId: null,
      error:
        'Dit e-mailadres is al gebruikt. Gebruik het wachtwoord van je vorige poging, of log in via het inlogscherm.',
    }
  }

  return {
    userId: null,
    error:
      signUpErr?.message ||
      signInErr?.message ||
      'Aanmelden mislukt. Controleer je wachtwoord en probeer opnieuw.',
  }
}

function isRpcMissing(err) {
  const code = String(err?.code ?? '')
  const msg = String(err?.message ?? '')
  return (
    code === 'PGRST202' ||
    msg.includes('Could not find the function') ||
    msg.includes('schema cache')
  )
}

/**
 * Fallback when DB RPC is not deployed: delete relation row (may fail RLS), then update profiles.
 * Still requires FK ON UPDATE CASCADE on exercise_* tables if the kind has assignments.
 */
async function linkPendingProfilesDirect(input, parentUserId, childUserId, email, childEmail) {
  await supabase
    .from('child_parent_relations')
    .delete()
    .eq('parent_id', input.parentProfile.id)
    .eq('child_id', input.childProfile.id)

  const { error: upParent } = await supabase
    .from('profiles')
    .update({
      id: parentUserId,
      user_id: parentUserId,
      email,
    })
    .eq('id', input.parentProfile.id)
    .is('user_id', null)

  if (upParent) {
    return { error: upParent }
  }

  const { error: upChild } = await supabase
    .from('profiles')
    .update({
      id: childUserId,
      user_id: childUserId,
      email: childEmail,
    })
    .eq('id', input.childProfile.id)
    .is('user_id', null)

  if (upChild) {
    return { error: upChild }
  }

  await supabase.from('child_parent_relations').insert({
    parent_id: parentUserId,
    child_id: childUserId,
  })

  return { error: null }
}

async function linkPendingProfilesRpc(input, inviteDigits, parentUserId, childUserId, email, childEmail) {
  const { error } = await supabase.rpc('complete_pending_family_registration', {
    p_invite_digits: inviteDigits,
    p_parent_old_id: input.parentProfile.id,
    p_child_old_id: input.childProfile.id,
    p_parent_auth_id: parentUserId,
    p_child_auth_id: childUserId,
    p_parent_email: email,
    p_child_email: childEmail,
  })
  return error
}

/**
 * Activatiecode-flow: maak ouder + kind Auth-gebruikers (zelfde wachtwoord), koppel pending profiles.
 * Als signup 422 "bestaat al": probeer inloggen met het gekozen wachtwoord (herstel halve registratie).
 */
export async function registerFamily(input) {
  const email = String(input.parentEmail ?? '').trim()
  const childEmail = childAuthEmail(input.inviteCode)

  const parent = await ensureAuthUser({ email, password: input.password })
  if (!parent.userId) {
    return {
      ok: false,
      message: parent.error || 'Aanmelden mislukt. Controleer je gegevens en probeer opnieuw.',
    }
  }

  const child = await ensureAuthUser({ email: childEmail, password: input.password })
  if (!child.userId) {
    return {
      ok: false,
      message:
        child.error ||
        'Het kindaccount kon niet worden aangemaakt. Als je dit eerder probeerde: gebruik hetzelfde wachtwoord, of neem contact op met je kinesist.',
    }
  }

  const inviteDigits = String(input.inviteCode ?? '').replace(/\D/g, '')

  let linkErr = await linkPendingProfilesRpc(
    input,
    inviteDigits,
    parent.userId,
    child.userId,
    email,
    childEmail
  )

  if (linkErr && isRpcMissing(linkErr)) {
    linkErr = (
      await linkPendingProfilesDirect(input, parent.userId, child.userId, email, childEmail)
    ).error
  }

  if (linkErr) {
    const raw = String(linkErr.message ?? '')
    const low = raw.toLowerCase()
    if (low.includes('invalid invite') || low.includes('invalid pending')) {
      return {
        ok: false,
        message:
          'Deze registratie kan niet worden voltooid (code of profiel klopt niet meer). Vraag je kinesist om een nieuwe uitnodiging of probeer in te loggen.',
      }
    }
    if (low.includes('23503') || low.includes('foreign key')) {
      return {
        ok: false,
        message:
          'De database moet nog worden bijgewerkt: voer de migratie met complete_pending_family_registration uit (zie map supabase/migrations), of vraag je beheerder.',
      }
    }
    return {
      ok: false,
      message:
        raw ||
        'Profiel koppelen mislukt. Voer de Supabase-migratie uit of neem contact op met je kinesist.',
    }
  }

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  })

  if (signInErr) {
    return {
      ok: false,
      message:
        'Registratie gelukt, maar inloggen mislukt. Probeer in te loggen met je e-mail en wachtwoord.',
    }
  }

  return { ok: true }
}
