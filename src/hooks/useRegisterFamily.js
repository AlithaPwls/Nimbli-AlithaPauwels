import supabase from '@/lib/supabaseClient.js'

function childAuthEmail(inviteCode) {
  const digits = String(inviteCode ?? '').replace(/\D/g, '')
  return `kind.${digits || inviteCode}@nimbli.be`
}

/**
 * Parent + synthetic child Auth users, then attach pending profile rows to Auth:
 * set both `id` and `user_id` to the new auth.users.id (same value).
 */
export async function registerFamily(input) {
  const email = String(input.parentEmail ?? '').trim()
  const childEmail = childAuthEmail(input.inviteCode)

  const { data: parentAuth, error: parentErr } = await supabase.auth.signUp({
    email,
    password: input.password,
  })

  if (parentErr) {
    return {
      ok: false,
      message: parentErr.message.includes('already registered')
        ? 'Dit e-mailadres is al in gebruik.'
        : 'Aanmelden mislukt. Controleer je e-mailadres en probeer opnieuw.',
    }
  }

  const parentUserId = parentAuth.user?.id
  if (!parentUserId) {
    return {
      ok: false,
      message:
        'Account kon niet worden aangemaakt. Als e-mailbevestiging aan staat, bevestig je mail en probeer daarna opnieuw in te loggen.',
    }
  }

  await supabase.auth.signOut()

  const { data: childAuth, error: childErr } = await supabase.auth.signUp({
    email: childEmail,
    password: input.password,
  })

  if (childErr) {
    return {
      ok: false,
      message:
        'Het kindaccount kon niet worden aangemaakt. Neem contact op met je kinesist of probeer later opnieuw.',
    }
  }

  const childUserId = childAuth.user?.id
  if (!childUserId) {
    return {
      ok: false,
      message:
        'Het kindaccount is niet volledig aangemaakt. Neem contact op met je kinesist.',
    }
  }

  await supabase.auth.signOut()

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
    return { ok: false, message: 'Profiel bijwerken mislukt. Neem contact op met je kinesist.' }
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
    return {
      ok: false,
      message: 'Kindprofiel bijwerken mislukt. Neem contact op met je kinesist.',
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

