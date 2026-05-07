import { createClient } from '@supabase/supabase-js'

// Vite inlines env at build time. Vercel/staging often uses generic names; local .env may use *_LOCAL_*.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_LOCAL_URL || import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_LOCAL_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase