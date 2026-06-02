import supabase from '@/lib/supabaseClient.js'
import { childAuthEmailForChildProfile } from '@/lib/childAuthEmail.js'

/**
 * Activates a pending child: verifies parent password, creates child Auth with that same password.
 */
export async function registerPendingChild({
  childProfileId,
  parentAuthUserId,
  parentEmail,
  password,
}) {
  if (!childProfileId || !parentAuthUserId || !password) {
    return { ok: false, message: 'Ongeldige invoer. Probeer opnieuw.' }
  }

  const parentPassword = String(password).trim()
  const parentEmailNorm = String(parentEmail ?? '').trim()

  if (!parentPassword) {
    return { ok: false, message: 'Vul je ouderwachtwoord in.' }
  }
  if (!parentEmailNorm) {
    return { ok: false, message: 'Ouder-e-mailadres ontbreekt op je profiel.' }
  }

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: parentEmailNorm,
    password: parentPassword,
  })
  if (verifyErr) {
    return {
      ok: false,
      message:
        'Ouderwachtwoord klopt niet. Gebruik het wachtwoord waarmee je inlogt als ouder — je kiest hier geen nieuw wachtwoord.',
    }
  }

  const { data: childRow, error: childLoadErr } = await supabase
    .from('profiles')
    .select('invite_code')
    .eq('id', childProfileId)
    .eq('role', 'child')
    .maybeSingle()

  if (childLoadErr) {
    return { ok: false, message: 'Kon kindprofiel niet laden. Probeer opnieuw.' }
  }

  const childEmail = childAuthEmailForChildProfile({
    inviteCode: childRow?.invite_code,
    profileId: childProfileId,
  })

  let childUserId = null

  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: childEmail,
    password: parentPassword,
  })

  if (!signUpErr && signUpData.user?.id) {
    childUserId = signUpData.user.id
  } else {
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: childEmail,
      password: parentPassword,
    })
    if (!signInErr && signInData.user?.id) {
      childUserId = signInData.user.id
    } else if (signUpErr) {
      const msg = String(signUpErr.message ?? '').toLowerCase()
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return {
          ok: false,
          message:
            'Dit kindaccount bestaat al met een ander wachtwoord (bv. na een eerdere mislukte activatie). Neem contact op met je kinesist.',
        }
      }
      return {
        ok: false,
        message: signUpErr.message || 'Het kindaccount kon niet worden aangemaakt.',
      }
    }
  }

  if (!childUserId) {
    return {
      ok: false,
      message: 'Het kindaccount kon niet worden aangemaakt. Probeer opnieuw.',
    }
  }

  await supabase.auth.signOut()

  const { error: restoreErr } = await supabase.auth.signInWithPassword({
    email: parentEmailNorm,
    password: parentPassword,
  })
  if (restoreErr) {
    return {
      ok: false,
      message:
        'Kindaccount is aangemaakt, maar opnieuw inloggen als ouder mislukte. Log in via het inlogscherm met je ouderwachtwoord.',
    }
  }

  const { error: rpcErr } = await supabase.rpc('complete_pending_child_registration', {
    p_child_old_id: childProfileId,
    p_child_auth_id: childUserId,
    p_parent_auth_id: parentAuthUserId,
    p_child_email: childEmail,
  })

  if (rpcErr) {
    const raw = String(rpcErr.message ?? '')
    const low = raw.toLowerCase()
    if (
      low.includes('could not find the function') ||
      low.includes('schema cache') ||
      rpcErr.code === 'PGRST202'
    ) {
      return {
        ok: false,
        message:
          'De database moet nog worden bijgewerkt (migratie complete_pending_child_registration). Vraag je beheerder.',
      }
    }
    if (low.includes('invalid')) {
      return {
        ok: false,
        message:
          'Dit kind kan niet worden geactiveerd. Controleer of de koppeling door je kinesist is aangemaakt.',
      }
    }
    return {
      ok: false,
      message: raw || 'Profiel koppelen mislukt. Neem contact op met je kinesist.',
    }
  }

  return { ok: true, childAuthId: childUserId }
}
