import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export type CallerKine = {
  id: string
  practice_id: string
}

export async function getCallerKine(
  admin: SupabaseClient,
  authUserId: string,
): Promise<CallerKine | null> {
  const { data, error } = await admin
    .from('profiles')
    .select('id, role, practice_id')
    .eq('user_id', authUserId)
    .eq('role', 'kine')
    .maybeSingle()

  if (error || !data?.practice_id) return null
  return { id: data.id, practice_id: data.practice_id }
}

export function isUuid(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  )
}
