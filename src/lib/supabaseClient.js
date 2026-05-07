import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_LOCAL_URL,
  import.meta.env.VITE_SUPABASE_ANON_LOCAL_KEY
)

export default supabase